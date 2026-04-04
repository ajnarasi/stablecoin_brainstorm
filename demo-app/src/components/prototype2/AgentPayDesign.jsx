import ArchitectureDiagram from '../shared/ArchitectureDiagram'
import DataTable from '../shared/DataTable'

const ARCH_BOXES = [
  { id: 'agent', title: 'AI Agent', subtitle: 'Browses + pays autonomously', x: 20, y: 100, color: '#FF6600' },
  { id: 'gateway', title: 'x402 Gateway', subtitle: 'HTTP 402 handler', x: 200, y: 100, color: '#008090' },
  { id: 'verifier', title: 'Verifier', subtitle: 'Signature + KYC check', x: 380, y: 100, color: '#003B5C' },
  { id: 'settler', title: 'Settler', subtitle: 'Solana / Base', x: 560, y: 100, color: '#003B5C' },
  { id: 'indx', title: 'INDX', subtitle: 'FIUSD -> USD', x: 740, y: 100, color: '#2E7D32' },
  { id: 'merchant', title: 'Merchant', subtitle: 'Receives USD', x: 740, y: 220, color: '#FF6600' },
]

const ARCH_ARROWS = [
  { from: 'agent', to: 'gateway', label: 'HTTP GET' },
  { from: 'gateway', to: 'verifier', label: 'Signed payment' },
  { from: 'verifier', to: 'settler', label: 'Authorized' },
  { from: 'settler', to: 'indx', label: 'FIUSD' },
  { from: 'indx', to: 'merchant', label: 'USD settlement' },
]

export default function AgentPayDesign() {
  return (
    <div className="docs-content">
      {/* Architecture */}
      <section className="docs-section">
        <h3 className="docs-section__title">System Architecture</h3>
        <ArchitectureDiagram boxes={ARCH_BOXES} arrows={ARCH_ARROWS} height={340} />
      </section>

      {/* Service Breakdown */}
      <section className="docs-section">
        <h3 className="docs-section__title">Service Breakdown</h3>
        <DataTable
          headers={['Service', 'Technology', 'Port', 'Responsibility']}
          rows={[
            ['x402 Gateway', 'Express.js', '8002', 'HTTP 402 response generation, payment instruction encoding, request routing'],
            ['Verifier', 'Node.js', 'Internal', 'EIP-3009 signature validation, KYC tier lookup, spending limit enforcement'],
            ['Settler', 'Node.js + Solana Web3', 'Internal', 'On-chain settlement execution on Solana devnet or Base testnet'],
            ['INDX Adapter', 'REST Client', 'Internal', 'FIUSD to USD conversion, merchant settlement crediting'],
            ['Receipt Service', 'Node.js', 'Internal', 'Cryptographic receipt generation with non-repudiation proof'],
            ['Transaction Store', 'SQLite', 'Internal', 'Transaction history, nonce tracking, daily spend aggregation'],
          ]}
        />
      </section>

      {/* Agent Identity Tiers */}
      <section className="docs-section">
        <h3 className="docs-section__title">Agent Identity Tiers</h3>
        <DataTable
          headers={['Tier', 'Per-Transaction Limit', 'Daily Limit', 'KYC Requirements', 'Use Case']}
          rows={[
            ['Basic', '$100', '$500', 'Email verification only', 'Low-value automated purchases, subscriptions'],
            ['Verified', '$1,000', '$5,000', 'Government ID + address verification', 'General consumer agent commerce'],
            ['Premium', '$10,000', '$50,000', 'Enterprise KYC + financial verification', 'Business procurement, high-value transactions'],
          ]}
        />
      </section>

      {/* Verifier Details */}
      <section className="docs-section">
        <h3 className="docs-section__title">Verification Pipeline</h3>
        <div className="docs-grid docs-grid--2">
          <div className="docs-card">
            <h4>Signature Validation</h4>
            <ul className="docs-list">
              <li>EIP-3009: Validate transferWithAuthorization signature</li>
              <li>Permit2 (EIP-2612): Alternative auth for Base chain</li>
              <li>Nonce verification: prevent replay attacks</li>
              <li>Expiry check: payment must be within 300s window</li>
            </ul>
          </div>
          <div className="docs-card">
            <h4>Spending Guardrails</h4>
            <ul className="docs-list">
              <li>Per-transaction limit based on KYC tier</li>
              <li>Rolling 24-hour daily spend limit</li>
              <li>Velocity checks: max 50 transactions per hour</li>
              <li>Merchant-level limits: configurable per merchant</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="docs-section">
        <h3 className="docs-section__title">Security Architecture</h3>
        <div className="docs-grid docs-grid--2">
          <div className="docs-card docs-card--bordered">
            <h4>Cryptographic Security</h4>
            <ul className="docs-list">
              <li>Nonce replay prevention: each payment uses a unique nonce, stored and checked server-side</li>
              <li>EIP-3009 signatures are non-transferable and non-replayable</li>
              <li>Receipt signing: every receipt includes a server-signed cryptographic proof</li>
              <li>TLS 1.3 for all API communications</li>
            </ul>
          </div>
          <div className="docs-card docs-card--bordered">
            <h4>Operational Security</h4>
            <ul className="docs-list">
              <li>KYC-tiered spending limits enforced at verification layer</li>
              <li>Real-time fraud monitoring on transaction patterns</li>
              <li>Automatic agent suspension on anomalous behavior</li>
              <li>Full audit trail for regulatory compliance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Settlement */}
      <section className="docs-section">
        <h3 className="docs-section__title">Settlement Flow</h3>
        <div className="docs-grid docs-grid--3">
          <div className="docs-card">
            <h4>1. On-Chain Settlement</h4>
            <p>
              The settler executes the signed transfer on Solana (or Base). FIUSD moves from the
              agent's wallet to the settlement address. Transaction is confirmed in under 1 second on Solana.
            </p>
          </div>
          <div className="docs-card">
            <h4>2. INDX Conversion</h4>
            <p>
              INDX converts the received FIUSD to USD at 1:1 peg. The merchant never touches
              stablecoin -- they receive USD in their Finxact settlement account.
            </p>
          </div>
          <div className="docs-card">
            <h4>3. Merchant Credit</h4>
            <p>
              The merchant's Finxact settlement account is credited instantly. The merchant
              receives the full product price minus the 0.1% x402 fee.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
