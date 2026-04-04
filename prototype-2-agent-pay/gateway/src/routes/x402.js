/**
 * x402 Protocol Routes
 *
 * Direct x402 verification and protocol endpoints.
 * These are used by agents that want to pre-verify payments
 * or interact with the x402 protocol directly rather than
 * through the middleware-gated product endpoints.
 *
 * POST /api/x402/verify     - Verify a signed payment payload
 * GET  /api/x402/status     - Protocol status and capabilities
 * POST /api/x402/receipt    - Retrieve a receipt by ID
 */

const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");

const router = Router();

// In-memory receipt store
const receipts = new Map();

// In-memory transaction log for dashboard
const transactions = [];

const VERIFIER_URL = process.env.VERIFIER_URL || "http://localhost:8003";
const SETTLER_URL = process.env.SETTLER_URL || "http://localhost:8004";

/**
 * POST /api/x402/verify
 * Verify and process a signed x402 payment payload.
 *
 * Request body:
 *   payment: { orderId, amount, token, chain, tokenAddress,
 *              paymentMethod, signature, sender, agentId, nonce }
 *   instructions: { ... original payment instructions ... }
 *
 * Response:
 *   On success: { valid: true, receipt, settlement }
 *   On failure: { valid: false, errors: [...] }
 */
router.post("/verify", async (req, res) => {
  const { payment, instructions, product } = req.body;

  if (!payment || !instructions) {
    return res.status(400).json({
      valid: false,
      errors: ["Missing required fields: payment, instructions"],
    });
  }

  try {
    // Step 1: Verify signature and payment details via verifier service
    let verifyResult;
    try {
      const verifyResponse = await fetch(`${VERIFIER_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment, instructions, product }),
      });
      verifyResult = await verifyResponse.json();
    } catch (err) {
      console.warn("Verifier unavailable, using simulation:", err.message);
      verifyResult = simulateVerification(payment, instructions);
    }

    if (!verifyResult.valid) {
      return res.json({
        valid: false,
        errors: verifyResult.errors,
      });
    }

    // Step 2: Settle on-chain via settler service
    let settlementResult;
    try {
      const settleResponse = await fetch(`${SETTLER_URL}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment,
          verificationResult: verifyResult,
        }),
      });
      settlementResult = await settleResponse.json();
    } catch (err) {
      console.warn("Settler unavailable, using simulation:", err.message);
      settlementResult = simulateSettlement(payment);
    }

    // Step 3: Generate receipt
    const receipt = {
      receiptId: `rcpt_${uuidv4().split("-")[0]}`,
      timestamp: new Date().toISOString(),
      amount: payment.amount,
      token: payment.token,
      chain: payment.chain,
      transactionId: settlementResult.txId || `sim_${uuidv4().split("-")[0]}`,
      merchantAddress:
        payment.chain === "solana"
          ? process.env.MERCHANT_WALLET_SOLANA
          : process.env.MERCHANT_WALLET_BASE,
      agentId: payment.agentId || "anonymous",
      orderId: payment.orderId,
      productId: product?.id || "unknown",
      signature: generateReceiptSignature(settlementResult),
    };

    // Store receipt
    receipts.set(receipt.receiptId, receipt);

    // Log transaction for dashboard
    const txn = {
      id: receipt.receiptId,
      type: "agent",
      timestamp: receipt.timestamp,
      amount: receipt.amount,
      token: receipt.token,
      chain: receipt.chain,
      status: settlementResult.settled ? "settled" : "pending",
      agentId: payment.agentId || "anonymous",
      agentTier: verifyResult.agentTier || "basic",
      merchantId: instructions.merchantId,
      orderId: payment.orderId,
      productName: product?.name || "Unknown Product",
      transactionId: receipt.transactionId,
      receipt,
    };
    transactions.push(txn);

    return res.json({
      valid: true,
      receipt,
      settlement: {
        settled: settlementResult.settled,
        chain: payment.chain,
        txId: receipt.transactionId,
        explorerUrl: getExplorerUrl(payment.chain, receipt.transactionId),
      },
    });
  } catch (err) {
    console.error("x402 verify error:", err);
    return res.status(500).json({
      valid: false,
      errors: ["Internal verification error"],
    });
  }
});

/**
 * GET /api/x402/status
 * Protocol capabilities and status
 */
router.get("/status", (req, res) => {
  res.json({
    protocol: "x402",
    version: "2.0",
    status: "active",
    supportedTokens: ["FIUSD", "USDC"],
    supportedChains: ["solana", "base"],
    supportedMethods: ["EIP-3009", "Permit2"],
    merchantId: "FISERV_DEMO_MERCHANT",
    gateway: "Fiserv x402 Gateway v0.1.0",
  });
});

/**
 * POST /api/x402/receipt
 * Retrieve a receipt by ID
 */
router.post("/receipt", (req, res) => {
  const { receiptId } = req.body;

  if (!receiptId) {
    return res.status(400).json({ error: "receiptId required" });
  }

  const receipt = receipts.get(receiptId);
  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  res.json({ receipt });
});

/**
 * GET /api/x402/transactions
 * Get transaction history for the dashboard
 */
router.get("/transactions", (req, res) => {
  const { limit = 50, offset = 0, type } = req.query;

  let filtered = transactions;
  if (type) {
    filtered = filtered.filter((t) => t.type === type);
  }

  // Sort newest first
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const page = sorted.slice(Number(offset), Number(offset) + Number(limit));

  // Generate simulated card transactions for dashboard comparison
  const cardTxns = generateSimulatedCardTransactions();

  res.json({
    total: sorted.length + cardTxns.length,
    agentTransactions: page,
    cardTransactions: cardTxns,
    summary: {
      totalAgentRevenue: transactions.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0
      ),
      totalAgentCount: transactions.length,
      averageAgentAmount:
        transactions.length > 0
          ? (
              transactions.reduce(
                (sum, t) => sum + parseFloat(t.amount),
                0
              ) / transactions.length
            ).toFixed(2)
          : "0.00",
    },
  });
});

// --- Helper functions ---

function simulateVerification(payment, instructions) {
  const errors = [];
  const now = Math.floor(Date.now() / 1000);

  if (instructions.expiry && now > instructions.expiry) {
    errors.push("Payment instructions expired");
  }
  if (payment.amount !== instructions.price) {
    errors.push("Amount mismatch");
  }
  if (!payment.signature) {
    errors.push("Missing signature");
  }

  return {
    valid: errors.length === 0,
    errors,
    agentTier: "basic",
    simulatedVerification: true,
  };
}

function simulateSettlement(payment) {
  return {
    settled: true,
    txId: `sim_${payment.chain}_${Date.now().toString(36)}`,
    chain: payment.chain,
    simulated: true,
  };
}

function generateReceiptSignature(settlementResult) {
  // In production, this would be a cryptographic signature by the gateway
  const data = JSON.stringify(settlementResult);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `gw_sig_${Math.abs(hash).toString(16).padStart(16, "0")}`;
}

function getExplorerUrl(chain, txId) {
  if (chain === "solana") {
    return `https://explorer.solana.com/tx/${txId}?cluster=devnet`;
  }
  if (chain === "base") {
    return `https://sepolia.basescan.org/tx/${txId}`;
  }
  return null;
}

function generateSimulatedCardTransactions() {
  // Generate a few simulated card transactions for dashboard comparison
  const cardTxns = [];
  const names = [
    "John D.",
    "Sarah M.",
    "Alex K.",
    "Emily R.",
    "Chris P.",
    "Jordan L.",
    "Taylor S.",
    "Morgan W.",
  ];
  const products = [
    "Nike Air Max 90",
    "Sony WH-1000XM5",
    "Levi's 501",
    "AirPods Pro 2",
    "Herschel Backpack",
  ];
  const amounts = [
    "139.99",
    "349.99",
    "69.50",
    "249.99",
    "89.99",
    "99.99",
    "149.00",
    "79.90",
  ];

  for (let i = 0; i < 8; i++) {
    const hoursAgo = Math.floor(Math.random() * 48);
    const ts = new Date(Date.now() - hoursAgo * 3600_000);

    cardTxns.push({
      id: `card_${Date.now().toString(36)}_${i}`,
      type: "card",
      timestamp: ts.toISOString(),
      amount: amounts[i % amounts.length],
      cardType: i % 3 === 0 ? "visa" : i % 3 === 1 ? "mastercard" : "amex",
      last4: String(1000 + Math.floor(Math.random() * 9000)),
      customerName: names[i % names.length],
      productName: products[i % products.length],
      status: "settled",
    });
  }

  return cardTxns;
}

module.exports = router;
