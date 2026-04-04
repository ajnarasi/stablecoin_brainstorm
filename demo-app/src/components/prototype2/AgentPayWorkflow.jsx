import WorkflowDiagram from '../shared/WorkflowDiagram'

const WORKFLOW_STEPS = [
  {
    title: 'Agent Request',
    subtitle: 'AI Agent browses catalog',
    system: 'HTTP GET to merchant API',
    timing: '~100ms',
  },
  {
    title: 'HTTP 402',
    subtitle: 'Gateway returns payment instructions',
    system: 'x402 protocol headers',
    timing: '~50ms',
  },
  {
    title: 'Sign Payment',
    subtitle: 'Agent SDK signs EIP-3009 payload',
    system: 'transferWithAuthorization',
    timing: '~200ms',
  },
  {
    title: 'Verify & Authorize',
    subtitle: 'Verifier checks signature + KYC + limits',
    system: 'Finxact KYC lookup',
    timing: '~300ms',
  },
  {
    title: 'On-Chain Settlement',
    subtitle: 'Settler executes on Solana/Base',
    system: 'Solana devnet / Base testnet',
    timing: '~800ms',
  },
  {
    title: 'Receipt & Delivery',
    subtitle: 'Product delivered, merchant settled',
    system: 'INDX USD settlement',
    timing: '~200ms',
  },
]

const STEP_DESCRIPTIONS = [
  "The AI agent browses the merchant's product catalog via the CommerceHub API. When it finds a product the user wants, it sends a standard HTTP GET request to the product endpoint. The agent doesn't need any special payment setup at this point -- it just makes a normal API call.",
  'The x402 Gateway intercepts the request and returns HTTP 402 Payment Required instead of the product data. The response headers contain structured payment instructions: the price, accepted tokens (FIUSD, USDC), supported chains (Solana, Base), the merchant\'s settlement address, and a 300-second expiry window.',
  'The Agent SDK automatically parses the 402 response, selects the optimal payment method (FIUSD on Solana for lowest fees), and constructs an EIP-3009 transferWithAuthorization message. The agent signs this message with its private key, creating a payment authorization that can only be executed once.',
  'The Verifier service validates the EIP-3009 signature, looks up the agent\'s KYC tier in Finxact, checks the per-transaction and daily spending limits, verifies the nonce hasn\'t been used before, and confirms the payment hasn\'t expired. All checks must pass for the payment to proceed.',
  'The Settler service takes the verified payment authorization and executes the on-chain transfer. On Solana, the FIUSD token transfer is submitted to devnet and confirmed in under 1 second. The transaction signature provides an immutable proof of settlement.',
  'After on-chain confirmation, INDX converts the FIUSD to USD and credits the merchant\'s Finxact settlement account. The merchant receives USD -- they never handle stablecoin. A cryptographic receipt is generated and returned to the agent as proof of purchase. The product data is then delivered to the agent.',
]

export default function AgentPayWorkflow() {
  return (
    <div className="docs-content">
      {/* Workflow Diagram */}
      <section className="docs-section">
        <h3 className="docs-section__title">End-to-End x402 Payment Workflow</h3>
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

      {/* Comparison */}
      <section className="docs-section">
        <h3 className="docs-section__title">Payment Method Comparison</h3>
        <div className="comparison-grid">
          <div className="comparison-card comparison-card--before">
            <div className="comparison-card__label">Card Payment (Traditional)</div>
            <div className="comparison-card__stats">
              <div className="comparison-stat">
                <span className="comparison-stat__value">30+ sec</span>
                <span className="comparison-stat__label">End-to-end latency</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value">Human Required</span>
                <span className="comparison-stat__label">3DS challenge / CVV entry</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value">2.9% + $0.30</span>
                <span className="comparison-stat__label">Transaction fee</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value">T+1 to T+3</span>
                <span className="comparison-stat__label">Merchant settlement</span>
              </div>
            </div>
          </div>
          <div className="comparison-card comparison-card--after">
            <div className="comparison-card__label">x402 Protocol (Agent Pay)</div>
            <div className="comparison-card__stats">
              <div className="comparison-stat">
                <span className="comparison-stat__value comparison-stat__value--highlight">&lt;3 sec</span>
                <span className="comparison-stat__label">End-to-end latency</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value comparison-stat__value--highlight">Fully Autonomous</span>
                <span className="comparison-stat__label">No human auth needed</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value comparison-stat__value--highlight">0.1%</span>
                <span className="comparison-stat__label">Transaction fee</span>
              </div>
              <div className="comparison-stat">
                <span className="comparison-stat__value comparison-stat__value--highlight">Instant</span>
                <span className="comparison-stat__label">Merchant settlement</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timing */}
      <section className="docs-section">
        <h3 className="docs-section__title">End-to-End Timing</h3>
        <div className="timing-bar">
          <div className="timing-bar__segment" style={{ flex: 0.5, background: 'var(--navy)' }}>
            <span>Request</span>
            <span>100ms</span>
          </div>
          <div className="timing-bar__segment" style={{ flex: 0.3, background: 'var(--orange)' }}>
            <span>402</span>
            <span>50ms</span>
          </div>
          <div className="timing-bar__segment" style={{ flex: 1, background: 'var(--teal)' }}>
            <span>Sign</span>
            <span>200ms</span>
          </div>
          <div className="timing-bar__segment" style={{ flex: 1.5, background: 'var(--navy)' }}>
            <span>Verify</span>
            <span>300ms</span>
          </div>
          <div className="timing-bar__segment" style={{ flex: 4, background: 'var(--green)' }}>
            <span>Settle</span>
            <span>800ms</span>
          </div>
          <div className="timing-bar__segment" style={{ flex: 1, background: 'var(--orange)' }}>
            <span>Receipt</span>
            <span>200ms</span>
          </div>
          <div className="timing-bar__total">Total: ~1.65s (vs 30+ seconds for card payments)</div>
        </div>
      </section>
    </div>
  )
}
