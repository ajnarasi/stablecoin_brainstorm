/**
 * Fiserv x402 Gateway
 *
 * Express server implementing the x402 Payment Required protocol.
 * Serves as the commerce gateway between AI agents and merchants,
 * coordinating payment verification and on-chain settlement.
 *
 * Port: 8002 (default)
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const productRoutes = require("./routes/products");
const x402Routes = require("./routes/x402");

const app = express();
const PORT = process.env.GATEWAY_PORT || 8002;

// --- Security middleware ---
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8002",
    ],
    exposedHeaders: ["X-PAYMENT", "X-PAYMENT-RESPONSE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-PAYMENT"],
  })
);

// --- Rate limiting ---
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
});
app.use(limiter);

// --- Logging ---
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);

// --- Body parsing ---
app.use(express.json({ limit: "1mb" }));

// --- Health check ---
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "x402-gateway",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --- Routes ---
app.use("/api/products", productRoutes);
app.use("/api/x402", x402Routes);

// --- Protocol info ---
app.get("/api/info", (req, res) => {
  res.json({
    name: "Fiserv x402 Commerce Gateway",
    version: "0.1.0",
    protocol: "x402-v2",
    description:
      "HTTP 402 Payment Required gateway enabling AI agents to purchase from merchants using stablecoins.",
    endpoints: {
      products: {
        list: "GET /api/products",
        search: "GET /api/products/search?q=<query>",
        detail: "GET /api/products/:id (requires x402 payment)",
      },
      x402: {
        verify: "POST /api/x402/verify",
        status: "GET /api/x402/status",
        receipt: "POST /api/x402/receipt",
        transactions: "GET /api/x402/transactions",
      },
    },
    supportedTokens: ["FIUSD", "USDC"],
    supportedChains: ["solana", "base"],
    supportedMethods: ["EIP-3009", "Permit2"],
  });
});

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: "Not Found",
    message: `No route matches ${req.method} ${req.path}`,
  });
});

// --- Error handler ---
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    status: 500,
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`\n  x402 Gateway running on http://localhost:${PORT}`);
  console.log(`  Protocol: x402-v2`);
  console.log(`  Products: GET http://localhost:${PORT}/api/products`);
  console.log(`  Status:   GET http://localhost:${PORT}/api/x402/status`);
  console.log(`  Health:   GET http://localhost:${PORT}/health\n`);
});

module.exports = app;
