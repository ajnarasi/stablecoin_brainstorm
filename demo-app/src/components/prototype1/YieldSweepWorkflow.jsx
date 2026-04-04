import WorkflowDiagram from '../shared/WorkflowDiagram'

const WORKFLOW_STEPS = [
  {
    title: 'Settlement Data',
    subtitle: 'Clover / CommerceHub',
    system: 'Real-time transaction feed',
    timing: 'Real-time',
  },
  {
    title: 'Cash Flow Prediction',
    subtitle: 'AI Treasury Agent',
    system: 'LightGBM ML model',
    timing: '~200ms inference',
  },
  {
    title: 'Safeguard Validation',
    subtitle: 'Decision Gate',
    system: '5 safety checks',
    timing: '~50ms',
  },
  {
    title: 'Position Transfer',
    subtitle: 'Finxact Ledger',
    system: 'Sweep to FIUSD',
    timing: '~500ms',
  },
  {
    title: 'Yield Accrual',
    subtitle: 'FIUSD Position',
    system: '4.2% APY',
    timing: 'Continuous',
  },
  {
    title: 'Instant Liquidity',
    subtitle: 'INDX Settlement',
    system: 'Unsweep when needed',
    timing: '<2 seconds',
  },
]

const STEP_DESCRIPTIONS = [
  'Real-time settlement data flows from Clover POS and CommerceHub into the AI Treasury Agent. This includes daily transaction volumes, average ticket sizes, refund rates, and seasonal patterns. The agent maintains a rolling 180-day window of merchant activity.',
  "The ML model (LightGBM) analyzes the settlement data to predict the merchant's cash outflow needs for the next 3 days. It considers day-of-week patterns, seasonal trends, and recent transaction velocity to produce a prediction with a confidence score.",
  'The Decision Gate runs 5 safeguard checks: (1) Hard floor -- balance cannot drop below historical max outflow + 20%, (2) ML confidence must exceed 70%, (3) Gradual ramp limits based on account age, (4) Depeg check on FIUSD, (5) Rate limit -- max 1 sweep per hour.',
  "If all safeguards pass, Finxact executes the position transfer. The sweep amount moves from the merchant's settlement account to a FIUSD yield-bearing position. The transfer is atomic and reversible.",
  "Once in FIUSD, the position earns 4.2% APY continuously. Yield accrues daily and is credited to the merchant's position. The merchant can view real-time earnings in their dashboard.",
  "At any time, the merchant can trigger an emergency unsweep. INDX converts the FIUSD position back to USD at 1:1 peg and credits the merchant's settlement account in under 2 seconds. This is also triggered automatically if FIUSD depegs beyond 0.5%.",
]

export default function YieldSweepWorkflow() {
  return (
    <div className="docs-content">
      {/* Workflow Diagram */}
      <section className="docs-section">
        <h3 className="docs-section__title">End-to-End Sweep Workflow</h3>
        <WorkflowDiagram steps={WORKFLOW_STEPS} />
      </section>

      {/* Detailed Step Descriptions */}
      <section className="docs-section">
        <h3 className="docs-section__title">Step-by-Step Breakdown</h3>
        <div className="workflow-details">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={i} className="workflow-detail-card">
              <div className="workflow-detail-card__number">{i + 1}</div>
              <div className="workflow-detail-card__content">
                <h4>{step.title}</h4>
                <p className="workflow-detail-card__sub">{step.subtitle} -- {step.system}</p>
                <p className="workflow-detail-card__timing">Latency: {step.timing}</p>
                <p className="workflow-detail-card__desc">{STEP_DESCRIPTIONS[i]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Before/After Comparison */}
      <section className="docs-section">
        <h3 className="docs-section__title">Impact Comparison</h3>
        <div className="comparison-grid">
          <div className="comparison-card comparison-card--before">
            <div className="comparison-card__label">Before: Manual Treasury</div>
            <div className="comparison-card__stats">
              <div className="comparison-stat">
                <span className="comparison-stat__value">$0</span>
                <span className="comparison-stat__label">Monthly yield on idle cash</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value">0%</span>
                <span className="comparison-stat__label">SMBs using treasury services</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value">N/A</span>
                <span className="comparison-stat__label">Cash flow prediction</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value">Manual</span>
                <span className="comparison-stat__label">Liquidity management</span>
              </div>
            </div>
          </div>
          <div className="comparison-card comparison-card--after">
            <div className="comparison-card__label">After: AI Treasury Agent</div>
            <div className="comparison-card__stats">
              <div className="comparison-stat">
                <span className="comparison-stat__value comparison-stat__value--highlight">$847</span>
                <span className="comparison-stat__label">Monthly yield earned automatically</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value comparison-stat__value--highlight">100%</span>
                <span className="comparison-stat__label">Fully automated, zero merchant effort</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value comparison-stat__value--highlight">87%</span>
                <span className="comparison-stat__label">ML prediction confidence</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value comparison-stat__value--highlight">&lt;2s</span>
                <span className="comparison-stat__label">Instant liquidity return</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timing */}
      <section className="docs-section">
        <h3 className="docs-section__title">End-to-End Timing</h3>
        <div className="timing-bar">
          <div className="timing-bar__segment" style={{ flex: 1, background: 'var(--navy)' }}>
            <span>Data Ingest</span>
            <span>Real-time</span>
          </div>
          <div className="timing-bar__segment" style={{ flex: 1, background: 'var(--teal)' }}>
            <span>ML Predict</span>
            <span>200ms</span>
          </div>
          <div className="timing-bar__segment" style={{ flex: 0.5, background: 'var(--orange)' }}>
            <span>Validate</span>
            <span>50ms</span>
          </div>
          <div className="timing-bar__segment" style={{ flex: 1, background: 'var(--green)' }}>
            <span>Transfer</span>
            <span>500ms</span>
          </div>
          <div className="timing-bar__total">Total: ~750ms per sweep decision</div>
        </div>
      </section>
    </div>
  )
}
