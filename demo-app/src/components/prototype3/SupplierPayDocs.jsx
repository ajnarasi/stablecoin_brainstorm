import CodeBlock from '../shared/CodeBlock';

export default function SupplierPayDocs() {
  return (
    <div className="docs-content">
      <section className="docs-section">
        <h2>Problem Statement</h2>
        <p>
          Restaurants spend $50,000+/month on ingredients from distributors. Every payment incurs
          2-3% card processing fees -- that is $1,000-$1,500/month in pure waste. Distributors
          wait 2-5 business days for settlement. Because suppliers do not get paid quickly,
          merchants miss early-payment discounts (typically 2% for net-24h terms) that would
          reduce their ingredient costs further.
        </p>
        <div className="docs-callout docs-callout--problem">
          <strong>Key Pain Points:</strong>
          <ul>
            <li>2.9% average card processing fee on B2B supplier payments</li>
            <li>2-5 day settlement delays for suppliers</li>
            <li>Missed early-pay discounts (2% net-24h terms) due to slow rails</li>
            <li>No automated procurement -- manual ordering wastes labor</li>
            <li>Stockouts from poor demand forecasting</li>
          </ul>
        </div>
      </section>

      <section className="docs-section">
        <h2>Solution: AI Procurement Agent + Instant FIUSD</h2>
        <p>
          An AI procurement agent monitors real-time sales from the Clover POS, maps menu item
          sales to ingredient consumption using a Bill of Materials (BOM), predicts depletion
          dates with gradient-boosted ML models, generates optimized purchase orders, and pays
          suppliers instantly in FIUSD -- capturing early-pay discounts automatically.
        </p>
        <div className="docs-callout docs-callout--solution">
          <strong>How It Works:</strong>
          <ol>
            <li>Clover POS sales data feeds the BOM engine</li>
            <li>BOM maps each menu item to ingredient consumption rates</li>
            <li>ML model predicts ingredient depletion with day-of-week seasonality</li>
            <li>Procurement agent generates POs when stock hits reorder points</li>
            <li>Instant FIUSD payment via Finxact captures 2% early-pay discount</li>
            <li>INDX settles supplier in USD within seconds</li>
          </ol>
        </div>
      </section>

      <section className="docs-section">
        <h2>Key Innovation: Bill of Materials (BOM) Mapping</h2>
        <p>
          The BOM maps every menu item to its ingredient components. When a Margherita Pizza
          sells, the system deducts 0.5lb flour, 0.3lb mozzarella, 0.2lb tomato sauce, etc.
          This creates a real-time ingredient consumption model that is far more accurate than
          simple par-level reordering.
        </p>
        <CodeBlock
          title="BOM Mapping Example"
          language="json"
          code={`{
  "menuItem": "Margherita Pizza (Large)",
  "sku": "PIZZA_MARG_LG",
  "ingredients": [
    { "name": "pizza_dough_flour", "quantity": 0.5, "unit": "lb" },
    { "name": "mozzarella", "quantity": 0.3, "unit": "lb" },
    { "name": "tomato_sauce", "quantity": 0.2, "unit": "lb" },
    { "name": "olive_oil", "quantity": 0.02, "unit": "L" },
    { "name": "basil", "quantity": 0.01, "unit": "lb" }
  ],
  "avgDailySales": 45
}`}
        />
      </section>

      <section className="docs-section">
        <h2>Revenue Model</h2>
        <div className="docs-callout docs-callout--info">
          <ul>
            <li><strong>Transaction Fee:</strong> Small fee on each B2B FIUSD payment (much less than 2.9% card fee)</li>
            <li><strong>Discount Sharing:</strong> Share of early-payment discount savings with Fiserv platform</li>
            <li><strong>SaaS Component:</strong> AI procurement agent subscription for Clover merchants</li>
          </ul>
        </div>
      </section>

      <section className="docs-section">
        <h2>API Reference</h2>

        <h3>POST /api/demo/seed</h3>
        <p>Seeds the demo database with Mario's Pizzeria, 30 days of sales history, ingredient inventory, and supplier catalog.</p>
        <CodeBlock
          title="Response"
          language="json"
          code={`{
  "status": "seeded",
  "merchant": "Mario's Pizzeria",
  "salesGenerated": 1350,
  "ingredientsTracked": 12,
  "suppliersCreated": 3
}`}
        />

        <h3>POST /api/merchants/{'{merchantId}'}/evaluate</h3>
        <p>Evaluates current inventory levels against ML-predicted depletion rates. Returns status for each ingredient.</p>
        <CodeBlock
          title="Response"
          language="json"
          code={`{
  "ingredients": [
    {
      "name": "chicken_breast",
      "currentStock": 15,
      "unit": "lb",
      "reorderPoint": 25,
      "daysUntilDepletion": 1.5,
      "status": "CRITICAL"
    },
    {
      "name": "mozzarella",
      "currentStock": 20,
      "unit": "lb",
      "reorderPoint": 18,
      "daysUntilDepletion": 2.1,
      "status": "LOW"
    }
  ]
}`}
        />

        <h3>POST /api/merchants/{'{merchantId}'}/auto-order</h3>
        <p>The main demo action. Triggers the AI procurement agent to evaluate inventory, generate POs, and execute instant FIUSD payments.</p>
        <CodeBlock
          title="Response"
          language="json"
          code={`{
  "purchaseOrders": [
    {
      "id": "PO-001",
      "supplierName": "Fresh Foods Inc.",
      "supplierId": "SUP_001",
      "items": [
        { "ingredient": "chicken_breast", "quantity": "50lb", "cost": 187.50 },
        { "ingredient": "mozzarella", "quantity": "30lb", "cost": 150.00 }
      ],
      "totalCost": 337.50,
      "discountAmount": 6.75,
      "netAmount": 330.75,
      "settlementTime": 2.3
    }
  ],
  "totalDiscounts": 7.95,
  "cardFeesSaved": 11.93,
  "monthlySavings": 1200
}`}
        />

        <h3>GET /api/merchants/{'{merchantId}'}/savings</h3>
        <p>Returns cumulative savings report comparing FIUSD payments vs. traditional card payments.</p>

        <h3>GET /api/merchants/{'{merchantId}'}/suppliers</h3>
        <p>Returns the supplier catalog with payment terms and supported currencies.</p>
      </section>
    </div>
  );
}
