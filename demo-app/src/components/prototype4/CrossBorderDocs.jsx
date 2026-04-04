import CodeBlock from '../shared/CodeBlock';

export default function CrossBorderDocs() {
  return (
    <div className="docs-content">
      <section className="docs-section">
        <h2>Problem Statement</h2>
        <p>
          Cross-border card processing costs merchants 3-5% in processing fees plus an
          additional 2-4% in FX markups. The global cross-border payments market exceeds
          $190 trillion annually. Settlement takes T+3 business days, and each transaction
          passes through 4 intermediaries, each taking a cut.
        </p>
        <div className="docs-callout docs-callout--problem">
          <strong>Key Pain Points:</strong>
          <ul>
            <li>4.75%+ total cost on cross-border card transactions</li>
            <li>2.5% hidden FX markup baked into card network rates</li>
            <li>3 business day settlement with weekends/holidays adding more</li>
            <li>4 intermediaries: issuing bank, card network, acquiring bank, FX provider</li>
            <li>No visibility into FX rates or fee breakdowns</li>
          </ul>
        </div>
      </section>

      <section className="docs-section">
        <h2>Solution: FIUSD Cross-Border Rails</h2>
        <p>
          CommerceHub automatically detects cross-border transactions by comparing buyer and
          merchant currencies. When a currency mismatch is found, the system routes the payment
          through FIUSD stablecoin rails instead of traditional card networks -- converting the
          buyer's local currency to FIUSD at real-time rates, transferring on Solana, and
          settling to the merchant in USD via INDX in seconds.
        </p>
        <div className="docs-callout docs-callout--solution">
          <strong>How It Works:</strong>
          <ol>
            <li>International buyer initiates payment in their local currency</li>
            <li>CommerceHub detects currency mismatch and identifies corridor</li>
            <li>Route comparison: card rails vs. stablecoin rails (always cheaper)</li>
            <li>OFAC/sanctions compliance screening (automatic)</li>
            <li>FX engine locks rate for 30-second window</li>
            <li>Convert local currency to FIUSD at real-time rate</li>
            <li>FIUSD transfer on Solana (400ms confirmation)</li>
            <li>INDX settles USD to merchant bank account in seconds</li>
          </ol>
        </div>
      </section>

      <section className="docs-section">
        <h2>Supported Corridors</h2>
        <p>
          The demo supports three high-volume corridors. In production, the system expands to
          any currency pair by routing through FIUSD as the universal bridge currency.
        </p>
        <div className="docs-callout docs-callout--info">
          <ul>
            <li><strong>MXN to USD:</strong> Mexico to US -- highest volume Latin American corridor</li>
            <li><strong>EUR to USD:</strong> Europe to US -- largest global commerce corridor</li>
            <li><strong>GBP to USD:</strong> UK to US -- significant e-commerce corridor</li>
          </ul>
        </div>
      </section>

      <section className="docs-section">
        <h2>Compliance</h2>
        <p>
          All cross-border transactions pass through OFAC/sanctions screening before processing.
          In this demo, screening is simulated with a pass-through stub. In production, this
          integrates with Fiserv's existing compliance infrastructure for real-time screening
          against SDN, OFAC, and country-specific sanctions lists.
        </p>
      </section>

      <section className="docs-section">
        <h2>API Reference</h2>

        <h3>POST /api/demo/seed</h3>
        <p>Seeds GlobalTech Store with cross-border transaction history and buyer profiles across all corridors.</p>
        <CodeBlock
          title="Response"
          language="json"
          code={`{
  "status": "seeded",
  "merchant": "GlobalTech Store",
  "transactionsGenerated": 150,
  "corridorsActive": 3,
  "buyersCreated": 4
}`}
        />

        <h3>POST /api/demo/live-transaction</h3>
        <p>
          The main demo action. Processes a cross-border payment with real-time route comparison,
          FX conversion, and settlement.
        </p>
        <CodeBlock
          title="Request"
          language="json"
          code={`{
  "buyerId": "BUYER_MXN",
  "amountLocal": 17500
}`}
        />
        <CodeBlock
          title="Response"
          language="json"
          code={`{
  "transactionId": "TXN-CB-001",
  "buyerId": "BUYER_MXN",
  "amountLocal": 17500,
  "currency": "MXN",
  "fxRate": 0.05714,
  "amountUsd": 1000.00,
  "cardRoute": {
    "totalFee": 60.00,
    "feePercent": "6.0",
    "settlementDays": 3,
    "intermediaries": 4
  },
  "stablecoinRoute": {
    "totalFee": 5.00,
    "feePercent": "0.5",
    "settlementTime": 3.2
  },
  "savings": 55.00,
  "savingsPercent": "91.7",
  "settlementTime": 3.2
}`}
        />

        <h3>GET /api/merchants/{'{merchantId}'}/comparisons</h3>
        <p>Returns aggregate route comparisons across all corridors.</p>

        <h3>GET /api/merchants/{'{merchantId}'}/analytics</h3>
        <p>Returns corridor-level analytics with savings totals and transaction counts.</p>

        <h3>GET /api/fx/rates</h3>
        <p>Returns current FX rates for all supported corridors.</p>
        <CodeBlock
          title="Response"
          language="json"
          code={`{
  "rates": {
    "MXN_USD": 0.05714,
    "EUR_USD": 1.08650,
    "GBP_USD": 1.27340
  },
  "timestamp": "2025-05-14T10:30:00Z",
  "source": "aggregated"
}`}
        />
      </section>
    </div>
  );
}
