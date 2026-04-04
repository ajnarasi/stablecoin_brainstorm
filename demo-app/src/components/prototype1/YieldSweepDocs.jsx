import CodeBlock from '../shared/CodeBlock'
import DataTable from '../shared/DataTable'

const dashboardResponse = `{
  "merchantId": "DEMO_MERCHANT_001",
  "merchantName": "Mario's Pizzeria",
  "availableBalance": 23450.00,
  "yieldPosition": 5231.50,
  "monthlyEarnings": 18.31,
  "apy": 4.2,
  "totalEarningsToDate": 142.87,
  "sweepCount": 12,
  "lastSweepDate": "2026-04-02T14:30:00Z",
  "riskTolerance": "moderate"
}`

const sweepEvalResponse = `{
  "approved": true,
  "sweepAmount": 781.50,
  "currentBalance": 23450.00,
  "predictedOutflows": 15200.00,
  "confidence": 0.87,
  "hardFloor": 18240.00,
  "excessAvailable": 5210.00,
  "rampPercent": 15,
  "reason": "Excess above safety floor with ML confidence > 80%",
  "yieldPosition": 5231.50,
  "newYieldPosition": 6013.00,
  "projectedMonthly": 21.05,
  "apy": 4.2
}`

const unsweepResponse = `{
  "success": true,
  "amount": 6013.00,
  "previousYieldPosition": 6013.00,
  "newYieldPosition": 0.00,
  "newAvailableBalance": 29463.00,
  "latency": "1.2s",
  "reason": "Emergency merchant override"
}`

export default function YieldSweepDocs() {
  return (
    <div className="docs-content">
      {/* Problem Statement */}
      <section className="docs-section">
        <h3 className="docs-section__title">The Problem</h3>
        <div className="docs-callout docs-callout--problem">
          <p>
            SMB merchants maintain $15K-$50K in idle settlement account balances that earn zero interest.
            99% of small and medium businesses consume zero treasury management services -- these tools are
            designed for enterprises with dedicated CFOs and treasury teams.
          </p>
          <p>
            The result: billions of dollars sitting idle across Fiserv's merchant base, generating no yield
            for merchants and no revenue for Fiserv.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="docs-section">
        <h3 className="docs-section__title">The Solution</h3>
        <div className="docs-callout docs-callout--solution">
          <p>
            An AI-powered treasury agent that automatically sweeps idle merchant balances into
            yield-bearing FIUSD positions on Finxact. Machine learning predicts cash flow needs to ensure
            merchants always have sufficient liquidity for operations, while excess funds earn 4.2% APY.
          </p>
          <ul className="docs-list">
            <li>Fully automated -- no merchant action required after opt-in</li>
            <li>ML-predicted outflows ensure zero liquidity disruption</li>
            <li>Instant unsweep available 24/7 for emergency liquidity</li>
            <li>Gradual ramp-up builds confidence over first 6 months</li>
          </ul>
        </div>
      </section>

      {/* Why Only Fiserv */}
      <section className="docs-section">
        <h3 className="docs-section__title">Why Only Fiserv Can Build This</h3>
        <div className="docs-grid docs-grid--3">
          <div className="docs-card">
            <h4>CommerceHub Data</h4>
            <p>
              Real-time settlement data from Clover POS provides the training data for cash flow prediction.
              No third party has this transaction-level visibility.
            </p>
          </div>
          <div className="docs-card">
            <h4>Finxact Ledger</h4>
            <p>
              Native core banking ledger enables real-time position management, instant transfers, and
              regulatory-compliant record keeping -- all within Fiserv's infrastructure.
            </p>
          </div>
          <div className="docs-card">
            <h4>INDX Liquidity</h4>
            <p>
              FIUSD stablecoin provides the yield-bearing instrument with instant settlement and 1:1 USD peg.
              The closed loop means no external dependencies.
            </p>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="docs-section">
        <h3 className="docs-section__title">API Reference</h3>
        <DataTable
          headers={['Method', 'Path', 'Description']}
          rows={[
            ['POST', '/api/demo/seed', 'Seed demo data with 180 days of settlement history and train ML model'],
            ['GET', '/api/merchants/{id}/dashboard', 'Get merchant dashboard with balance, yield position, and earnings'],
            ['POST', '/api/merchants/{id}/sweeps/evaluate', 'Evaluate and execute a sweep based on ML prediction and safeguards'],
            ['POST', '/api/merchants/{id}/unsweep', 'Emergency unsweep -- instantly return all yield position to available balance'],
            ['GET', '/api/demo/scenario', 'Get current demo scenario configuration'],
          ]}
        />

        <h4 className="docs-subsection__title">GET /api/merchants/{'{id}'}/dashboard</h4>
        <CodeBlock language="json" code={dashboardResponse} />

        <h4 className="docs-subsection__title">POST /api/merchants/{'{id}'}/sweeps/evaluate</h4>
        <CodeBlock language="json" code={sweepEvalResponse} />

        <h4 className="docs-subsection__title">POST /api/merchants/{'{id}'}/unsweep</h4>
        <CodeBlock language="json" code={unsweepResponse} />
      </section>

      {/* Demo Merchant */}
      <section className="docs-section">
        <h3 className="docs-section__title">Demo Merchant Profile</h3>
        <div className="docs-callout docs-callout--info">
          <div className="docs-grid docs-grid--2">
            <div>
              <strong>Business:</strong> Mario's Pizzeria<br />
              <strong>Merchant ID:</strong> DEMO_MERCHANT_001<br />
              <strong>Industry:</strong> Italian Restaurant / QSR<br />
              <strong>Location:</strong> San Francisco, CA
            </div>
            <div>
              <strong>Avg Daily Balance:</strong> $25,000<br />
              <strong>Peak Daily Outflow:</strong> $15,200<br />
              <strong>Settlement Frequency:</strong> Daily<br />
              <strong>Clover POS:</strong> 2 terminals
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
