/**
 * x402 Payment Instruction Generator
 *
 * Generates RFC-compliant x402 payment instruction payloads that tell
 * the requesting agent exactly how to pay for a resource.
 */

const { v4: uuidv4 } = require("uuid");

// Token contract addresses (devnet / testnet)
const FIUSD_MINT_ADDRESS =
  process.env.FIUSD_MINT_ADDRESS ||
  "FiUSDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const USDC_SOLANA_ADDRESS =
  process.env.USDC_SOLANA_ADDRESS ||
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_BASE_ADDRESS =
  process.env.USDC_BASE_ADDRESS ||
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const MERCHANT_WALLET_SOLANA =
  process.env.MERCHANT_WALLET_SOLANA ||
  "FsrvMerchant1111111111111111111111111111111";
const MERCHANT_WALLET_BASE =
  process.env.MERCHANT_WALLET_BASE ||
  "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

const PAYMENT_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * Generate a unique order ID with timestamp prefix
 */
function generateOrderId() {
  const ts = Date.now().toString(36);
  const rand = uuidv4().split("-")[0];
  return `ORD-${ts}-${rand}`.toUpperCase();
}

/**
 * Generate x402-compliant payment instructions for a product
 *
 * @param {Object} product - The product being purchased
 * @param {Object} options - Optional overrides
 * @returns {Object} Payment instructions for X-PAYMENT header
 */
function generatePaymentInstructions(product, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const orderId = options.orderId || generateOrderId();

  return {
    version: "x402-v2",
    price: product.price,
    currency: "USD",
    acceptedTokens: [
      {
        token: "FIUSD",
        chain: "solana",
        address: FIUSD_MINT_ADDRESS,
        decimals: 6,
        recipient: MERCHANT_WALLET_SOLANA,
      },
      {
        token: "USDC",
        chain: "solana",
        address: USDC_SOLANA_ADDRESS,
        decimals: 6,
        recipient: MERCHANT_WALLET_SOLANA,
      },
      {
        token: "USDC",
        chain: "base",
        address: USDC_BASE_ADDRESS,
        decimals: 6,
        recipient: MERCHANT_WALLET_BASE,
      },
    ],
    paymentMethods: ["EIP-3009", "Permit2"],
    merchantId: options.merchantId || "FISERV_DEMO_MERCHANT",
    orderId,
    productId: product.id,
    description: `Purchase: ${product.name}`,
    expiry: now + (options.expirySeconds || PAYMENT_EXPIRY_SECONDS),
    issuedAt: now,
    nonce: uuidv4().replace(/-/g, ""),
    gatewayUrl:
      options.gatewayUrl ||
      `http://localhost:${process.env.GATEWAY_PORT || 8002}`,
    verifyEndpoint: "/api/x402/verify",
  };
}

/**
 * Validate that a payment payload matches issued instructions
 */
function validatePaymentPayload(payload, instructions) {
  const errors = [];

  if (!payload) {
    return { valid: false, errors: ["Missing payment payload"] };
  }

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (instructions.expiry && now > instructions.expiry) {
    errors.push("Payment instructions have expired");
  }

  // Check amount matches
  if (payload.amount !== instructions.price) {
    errors.push(
      `Amount mismatch: expected ${instructions.price}, got ${payload.amount}`
    );
  }

  // Check token is accepted
  const acceptedToken = instructions.acceptedTokens.find(
    (t) =>
      t.token === payload.token &&
      t.chain === payload.chain &&
      t.address === payload.tokenAddress
  );
  if (!acceptedToken) {
    errors.push(
      `Token ${payload.token} on ${payload.chain} is not accepted for this payment`
    );
  }

  // Check payment method is supported
  if (
    payload.paymentMethod &&
    !instructions.paymentMethods.includes(payload.paymentMethod)
  ) {
    errors.push(`Payment method ${payload.paymentMethod} is not supported`);
  }

  // Check order ID matches
  if (payload.orderId !== instructions.orderId) {
    errors.push("Order ID mismatch");
  }

  return {
    valid: errors.length === 0,
    errors,
    acceptedToken,
  };
}

module.exports = {
  generatePaymentInstructions,
  validatePaymentPayload,
  generateOrderId,
  FIUSD_MINT_ADDRESS,
  USDC_SOLANA_ADDRESS,
  USDC_BASE_ADDRESS,
  MERCHANT_WALLET_SOLANA,
  MERCHANT_WALLET_BASE,
};
