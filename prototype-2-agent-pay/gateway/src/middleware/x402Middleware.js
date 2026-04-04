/**
 * x402 Middleware
 *
 * Express middleware implementing the HTTP 402 Payment Required protocol.
 * Intercepts product requests and enforces payment before granting access.
 *
 * Flow:
 *  1. Request arrives for a paid resource (product endpoint)
 *  2. If no X-PAYMENT header -> respond 402 with payment instructions
 *  3. If X-PAYMENT header present -> parse, validate, forward to verifier
 *  4. If payment verified -> attach receipt and continue to route handler
 *  5. If payment invalid -> respond 402 with error details
 */

const {
  generatePaymentInstructions,
} = require("../services/paymentInstructions");
const { getProductById } = require("../services/catalog");

const VERIFIER_URL =
  process.env.VERIFIER_URL || "http://localhost:8003";

/**
 * Create x402 middleware for product endpoints
 */
function createX402Middleware() {
  // In-memory store of issued payment instructions (orderId -> instructions)
  const issuedInstructions = new Map();

  // Clean up expired instructions every 60 seconds
  setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    for (const [orderId, instr] of issuedInstructions) {
      if (instr.expiry < now) {
        issuedInstructions.delete(orderId);
      }
    }
  }, 60_000);

  return async function x402Middleware(req, res, next) {
    // Only apply to product detail endpoints
    const productId = req.params.id;
    if (!productId) {
      return next();
    }

    const product = getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check for X-PAYMENT header
    const paymentHeader = req.headers["x-payment"];

    if (!paymentHeader) {
      // No payment provided - return 402 with instructions
      const instructions = generatePaymentInstructions(product, {
        gatewayUrl: `${req.protocol}://${req.get("host")}`,
      });

      // Store instructions for later verification
      issuedInstructions.set(instructions.orderId, instructions);

      res.status(402);
      res.set("X-PAYMENT", JSON.stringify(instructions));
      res.set("Content-Type", "application/json");
      return res.json({
        status: 402,
        message: "Payment Required",
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: "USD",
        },
        paymentInstructions: instructions,
      });
    }

    // Parse the payment payload
    let paymentPayload;
    try {
      paymentPayload =
        typeof paymentHeader === "string"
          ? JSON.parse(paymentHeader)
          : paymentHeader;
    } catch (err) {
      return res.status(400).json({
        error: "Invalid X-PAYMENT header",
        details: "Could not parse JSON payload",
      });
    }

    // Retrieve the matching instructions
    const instructions = issuedInstructions.get(paymentPayload.orderId);
    if (!instructions) {
      // Instructions may have expired or never existed - issue fresh ones
      const freshInstructions = generatePaymentInstructions(product, {
        gatewayUrl: `${req.protocol}://${req.get("host")}`,
      });
      issuedInstructions.set(freshInstructions.orderId, freshInstructions);

      res.status(402);
      res.set("X-PAYMENT", JSON.stringify(freshInstructions));
      return res.json({
        status: 402,
        message: "Payment instructions expired or invalid. New instructions issued.",
        paymentInstructions: freshInstructions,
      });
    }

    // Forward to verifier service
    try {
      const verifyResponse = await fetch(`${VERIFIER_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment: paymentPayload,
          instructions,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
          },
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.valid) {
        return res.status(402).json({
          status: 402,
          message: "Payment verification failed",
          errors: verifyResult.errors,
          paymentInstructions: instructions,
        });
      }

      // Payment verified - clean up and attach receipt to request
      issuedInstructions.delete(paymentPayload.orderId);
      req.paymentReceipt = verifyResult.receipt;
      req.settlementResult = verifyResult.settlement;
      req.product = product;

      next();
    } catch (err) {
      // Verifier service unavailable - fall back to local validation
      console.error(
        "Verifier service unavailable, using local validation:",
        err.message
      );

      // Perform basic local validation
      const localResult = performLocalValidation(paymentPayload, instructions);

      if (!localResult.valid) {
        return res.status(402).json({
          status: 402,
          message: "Payment verification failed (local)",
          errors: localResult.errors,
          paymentInstructions: instructions,
        });
      }

      // Accept with local-only receipt
      issuedInstructions.delete(paymentPayload.orderId);
      req.paymentReceipt = localResult.receipt;
      req.product = product;

      next();
    }
  };
}

/**
 * Local validation fallback when verifier service is unavailable
 */
function performLocalValidation(payload, instructions) {
  const errors = [];
  const now = Math.floor(Date.now() / 1000);

  if (now > instructions.expiry) {
    errors.push("Payment instructions have expired");
  }

  if (payload.amount !== instructions.price) {
    errors.push(
      `Amount mismatch: expected ${instructions.price}, got ${payload.amount}`
    );
  }

  if (!payload.signature) {
    errors.push("Missing payment signature");
  }

  if (payload.orderId !== instructions.orderId) {
    errors.push("Order ID mismatch");
  }

  const acceptedToken = instructions.acceptedTokens.find(
    (t) => t.token === payload.token && t.chain === payload.chain
  );
  if (!acceptedToken) {
    errors.push("Token/chain combination not accepted");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    receipt: {
      receiptId: `rcpt_local_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      amount: payload.amount,
      token: payload.token,
      chain: payload.chain,
      orderId: payload.orderId,
      verificationMethod: "local",
      warning: "Verified locally - verifier service was unavailable",
    },
  };
}

module.exports = { createX402Middleware };
