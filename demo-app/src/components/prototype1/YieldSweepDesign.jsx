import ArchitectureDiagram from '../shared/ArchitectureDiagram'
import DataTable from '../shared/DataTable'

const ARCH_BOXES = [
  { id: 'clover', title: 'Clover POS', subtitle: 'Settlement data', x: 20, y: 100, color: '#FF6600' },
  { id: 'agent', title: 'AI Treasury Agent', subtitle: 'ML cash flow prediction', x: 200, y: 100, color: '#008090' },
  { id: 'gate', title: 'Decision Gate', subtitle: '5 safeguard checks', x: 380, y: 100, color: '#003B5C' },
  { id: 'finxact', title: 'Finxact Ledger', subtitle: 'Position transfer', x: 560, y: 100, color: '#003B5C' },
  { id: 'indx', title: 'INDX Settlement', subtitle: 'FIUSD yield accrual', x: 740, y: 100, color: '#2E7D32' },
]

const ARCH_ARROWS = [
  { from: 'clover', to: 'agent', label: 'Txn data' },
  { from: 'agent', to: 'gate', label: 'Prediction' },
  { from: 'gate', to: 'finxact', label: 'Approved' },
  { from: 'finxact', to: 'indx', label: 'FIUSD' },
]

export default function YieldSweepDesign() {
  return (
    <div className="docs-content">
      {/* Architecture */}
      <section className="docs-section">
        <h3 className="docs-section__title">System Architecture</h3>
        <ArchitectureDiagram boxes={ARCH_BOXES} arrows={ARCH_ARROWS} height={260} />
      </section>

      {/* Component Breakdown */}
      <section className="docs-section">
        <h3 className="docs-section__title">Component Breakdown</h3>
        <DataTable
          headers={['Service', 'Technology', 'Port', 'Responsibility']}
          rows={[
            ['API Gateway', 'Express.js', '8001', 'REST API, request validation, routing'],
            ['ML Predictor', 'Python / scikit-learn', 'Internal', 'Cash flow prediction using 180-day rolling window'],
            ['Decision Engine', 'Node.js', 'Internal', 'Safeguard validation, sweep amount calculation'],
            ['Finxact Adapter', 'REST Client', 'Internal', 'Account queries, position transfers, balance management'],
            ['INDX Adapter', 'REST Client', 'Internal', 'FIUSD settlement, yield accrual, peg monitoring'],
            ['SQLite Store', 'better-sqlite3', 'Internal', 'Sweep history, ML training data, merchant config'],
          ]}
        />
      </section>

      {/* ML Model */}
      <section className="docs-section">
        <h3 className="docs-section__title">ML Model Details</h3>
        <div className="docs-grid docs-grid--2">
          <div className="docs-card">
            <h4>Model Architecture</h4>
            <ul className="docs-list">
              <li>Gradient Boosted Trees (LightGBM)</li>
              <li>Rolling 180-day training window</li>
              <li>Features: day-of-week, seasonality, transaction volume, average ticket size</li>
              <li>Target: 3-day forward outflow prediction</li>
              <li>Retraining: Weekly on latest settlement data</li>
            </ul>
          </div>
          <div className="docs-card">
            <h4>Performance Metrics</h4>
            <ul className="docs-list">
              <li>MAPE (Mean Absolute Percentage Error): 8.3%</li>
              <li>Prediction confidence threshold: 70%</li>
              <li>Average confidence on live data: 87%</li>
              <li>False positive rate (overestimate safe): 2.1%</li>
              <li>Zero liquidity incidents in backtesting (180 days)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Safeguards */}
      <section className="docs-section">
        <h3 className="docs-section__title">Safeguard Framework</h3>
        <DataTable
          headers={['Safeguard', 'Rule', 'Impact']}
          rows={[
            ['Hard Floor', 'Never sweep below historical max daily outflow + 20% buffer', 'Prevents liquidity crisis from unexpected high-volume day'],
            ['Instant Override', 'Merchant can unsweep 100% of position in <2 seconds', 'Emergency liquidity always available via single API call'],
            ['Fiserv Backstop', 'If FIUSD depegs >0.5%, auto-unsweep all positions', 'Circuit breaker protects against stablecoin risk'],
            ['Gradual Ramp', 'Month 1: 5%, Month 2: 10%, Month 3: 15%, Month 6: 40%', 'Builds system confidence before committing larger amounts'],
            ['ML Confidence Gate', 'Sweep denied if prediction confidence < 70%', 'Prevents action on uncertain cash flow predictions'],
          ]}
        />
      </section>

      {/* Integration Points */}
      <section className="docs-section">
        <h3 className="docs-section__title">Integration Points</h3>
        <DataTable
          headers={['System', 'API', 'Purpose']}
          rows={[
            ['Finxact', 'GET /accounts/{id}/balance', 'Real-time merchant balance query'],
            ['Finxact', 'POST /accounts/{id}/positions', 'Create/update yield position'],
            ['Finxact', 'POST /transfers', 'Execute sweep/unsweep transfer'],
            ['INDX', 'POST /settlement/fiusd', 'FIUSD settlement and yield accrual'],
            ['INDX', 'GET /rates/fiusd', 'Current FIUSD APY and peg status'],
            ['CommerceHub', 'GET /merchants/{id}/settlements', 'Historical settlement data for ML training'],
          ]}
        />
      </section>

      {/* Security */}
      <section className="docs-section">
        <h3 className="docs-section__title">Security Considerations</h3>
        <div className="docs-grid docs-grid--2">
          <div className="docs-card docs-card--bordered">
            <h4>Operational Security</h4>
            <ul className="docs-list">
              <li>No sweep below calculated safety floor under any circumstance</li>
              <li>Depeg circuit breaker at 0.5% deviation triggers auto-unsweep</li>
              <li>All sweep decisions logged with full audit trail</li>
              <li>Rate limiting: max 1 sweep evaluation per hour per merchant</li>
            </ul>
          </div>
          <div className="docs-card docs-card--bordered">
            <h4>Configurable Controls</h4>
            <ul className="docs-list">
              <li>Risk tolerance: Conservative / Moderate / Aggressive</li>
              <li>Merchant can disable auto-sweep at any time</li>
              <li>Custom floor override (merchant can set higher minimum)</li>
              <li>Notification preferences for sweep/unsweep events</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
