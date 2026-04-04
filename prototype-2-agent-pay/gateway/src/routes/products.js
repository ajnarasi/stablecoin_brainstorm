/**
 * Product Routes
 *
 * GET  /api/products          - List all products (free, no payment required)
 * GET  /api/products/search   - Search products by query (free)
 * GET  /api/products/:id      - Get product details (requires x402 payment)
 *
 * The product detail endpoint is gated by the x402 middleware.
 * Requesting a product without an X-PAYMENT header returns HTTP 402
 * with payment instructions in the response body and X-PAYMENT header.
 */

const { Router } = require("express");
const {
  getAllProducts,
  getProductById,
  searchProducts,
} = require("../services/catalog");
const { createX402Middleware } = require("../middleware/x402Middleware");

const router = Router();
const x402 = createX402Middleware();

/**
 * GET /api/products
 * List all products. Supports optional ?category= filter.
 * This endpoint is free -- no payment required.
 */
router.get("/", (req, res) => {
  const { category } = req.query;
  const products = getAllProducts(category || null);

  res.json({
    count: products.length,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      imageUrl: p.imageUrl,
    })),
  });
});

/**
 * GET /api/products/search
 * Search products by name, description, or category.
 * This endpoint is free -- no payment required.
 */
router.get("/search", (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const results = searchProducts(q);

  res.json({
    query: q,
    count: results.length,
    products: results.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      description: p.description,
    })),
  });
});

/**
 * GET /api/products/:id
 * Get full product details. This endpoint requires x402 payment.
 *
 * Without X-PAYMENT header:
 *   Returns 402 Payment Required with payment instructions
 *
 * With valid X-PAYMENT header:
 *   Returns full product details + payment receipt
 */
router.get("/:id", x402, (req, res) => {
  // If we reach here, payment has been verified by x402 middleware
  const product = req.product;
  const receipt = req.paymentReceipt;
  const settlement = req.settlementResult;

  // Set payment response header
  res.set("X-PAYMENT-RESPONSE", JSON.stringify(receipt));

  res.json({
    status: "paid",
    product: {
      ...product,
      // Include full details only after payment
      fulfillment: {
        type: "digital_delivery",
        estimatedDelivery: "immediate",
        downloadUrl: `https://fulfillment.fiserv.demo/orders/${receipt.receiptId}`,
      },
    },
    receipt,
    settlement: settlement || null,
  });
});

module.exports = router;
