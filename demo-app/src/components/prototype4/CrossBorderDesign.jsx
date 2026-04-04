import ArchitectureDiagram from '../shared/ArchitectureDiagram';
import CodeBlock from '../shared/CodeBlock';
import DataTable from '../shared/DataTable';

export default function CrossBorderDesign() {
  const archNodes = [
    { label: 'International Buyer', description: 'Pays in MXN/EUR/GBP', type: 'external' },
    { label: 'CommerceHub Gateway', description: 'Cross-border detection', type: 'primary' },
    { label: 'FX Engine', description: 'Rate lock (30s window)', type: 'primary' },
    { label: 'Solana', description: 'FIUSD transfer (400ms)', type: 'default' },
    { label: 'INDX', description: 'USD settlement', type: 'external' },
    { label: 'US Merchant', description: 'Receives USD', type: 'external' },
  ];

  const feeColumns = [
    { key: 'corridor', label: 'Corridor' },
    { key: 'cardProcessing', label: 'Card Processing' },
    { key: 'cardFx', label: 'Card FX Markup' },
    { key: 'cardTotal', label: 'Card Total' },
    { key: 'stableFee', label: 'FIUSD Fee' },
    {
      key: 'savings',
      label: 'Savings',
      render: (val) => <strong style={{ color: 'var(--color-green)' }}>{val}</strong>,
    },
  ];

  const feeRows = [
    { corridor: 'MXN -> USD', cardProcessing: '3.5%', cardFx: '2.5%', cardTotal: '6.0%', stableFee: '0.5%', savings: '91.7%' },
    { corridor: 'EUR -> USD', cardProcessing: '2.9%', cardFx: '1.5%', cardTotal: '4.4%', stableFee: '0.4%', savings: '90.9%' },
    { corridor: 'GBP -> USD', cardProcessing: '2.9%', cardFx: '1.8%', cardTotal: '4.7%', stableFee: '0.4%', savings: '91.5%' },
  ];

  return (
    <div className="design-content">
      <section className="docs-section">
        <h2>System Architecture</h2>
        <ArchitectureDiagram
          title="Cross-Border Payment - End-to-End Flow"
          nodes={archNodes}
        />
        <p className="mt-md">
          International buyers pay in their local currency. CommerceHub detects the cross-border
          nature by comparing currencies, the FX engine locks a competitive rate, FIUSD is
          transferred on Solana in 400ms, and INDX settles USD to the merchant's bank account
          within seconds. Zero intermediaries.
        </p>
      </section>

      <section className="docs-section">
        <h2>Fee Comparison by Corridor</h2>
        <DataTable columns={feeColumns} data={feeRows} />
      </section>

      <section className="docs-section">
        <h2>FX Engine Design</h2>
        <p>
          The FX engine aggregates rates from multiple sources, applies a minimal bid/ask
          spread, and locks the rate for a 30-second execution window using Redis. This
          eliminates the hidden FX markups that card networks apply.
        </p>
        <CodeBlock
          title="FX Engine Configuration"
          language="json"
          code={`{
  "rateAggregation": {
    "sources": ["ECB", "Fed", "market_feed"],
    "method": "median",
    "refreshInterval": "5 seconds"
  },
  "rateLock": {
    "windowSeconds": 30,
    "storage": "Redis",
    "fallback": "refresh_and_retry"
  },
  "spread": {
    "MXN_USD": 0.002,
    "EUR_USD": 0.001,
    "GBP_USD": 0.001
  },
  "compliance": {
    "preScreening": "OFAC_SDN",
    "countryRestrictions": ["CU", "IR", "KP", "SY"],
    "maxTransactionUsd": 50000
  }
}`}
        />
      </section>

      <section className="docs-section">
        <h2>Cross-Border Detection Logic</h2>
        <p>
          CommerceHub uses three signals to detect cross-border transactions: currency mismatch,
          country comparison via IP/address, and corridor identification for optimal routing.
        </p>
        <CodeBlock
          title="Detection Algorithm"
          language="json"
          code={`{
  "detectionSteps": [
    {
      "step": 1,
      "check": "currency_mismatch",
      "logic": "buyer.currency != merchant.currency",
      "example": "MXN != USD -> CROSS_BORDER"
    },
    {
      "step": 2,
      "check": "country_comparison",
      "logic": "buyer.country != merchant.country",
      "example": "MX != US -> CONFIRMED"
    },
    {
      "step": 3,
      "check": "corridor_identification",
      "logic": "Map to known corridor for optimal routing",
      "example": "MXN->USD corridor -> apply MXN-specific rates"
    }
  ],
  "domesticFallback": "If same currency and country, use standard processing"
}`}
        />
      </section>

      <section className="docs-section">
        <h2>Settlement Architecture</h2>
        <p>
          The settlement process runs in three phases: FX conversion on the gateway,
          FIUSD transfer on Solana, and USD disbursement through INDX. Each phase is
          independently auditable with its own transaction hash.
        </p>
        <CodeBlock
          title="Settlement Phases"
          language="json"
          code={`{
  "phase1_fx_conversion": {
    "duration": "< 100ms",
    "input": "17,500 MXN",
    "output": "1,000 FIUSD",
    "rate": "0.05714 (locked for 30s)",
    "audit": "FX_LOCK_ID: fx-lock-abc123"
  },
  "phase2_fiusd_transfer": {
    "duration": "~400ms",
    "network": "Solana",
    "from": "buyer_escrow_wallet",
    "to": "merchant_wallet",
    "amount": "1,000 FIUSD",
    "audit": "SOL_TX: 5Kj8...mNq2"
  },
  "phase3_usd_settlement": {
    "duration": "~2.5 seconds",
    "provider": "INDX",
    "from": "merchant_wallet (FIUSD)",
    "to": "merchant_bank_account (USD)",
    "amount": "$1,000.00 USD",
    "audit": "INDX_REF: indx-settle-xyz789"
  }
}`}
        />
      </section>
    </div>
  );
}
