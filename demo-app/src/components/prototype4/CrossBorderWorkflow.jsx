import WorkflowDiagram from '../shared/WorkflowDiagram';

export default function CrossBorderWorkflow() {
  const steps = [
    {
      label: 'International Purchase',
      sublabel: 'Buyer pays in MXN/EUR/GBP',
      timing: 'Instant',
    },
    {
      label: 'Cross-Border Detection',
      sublabel: 'CommerceHub identifies currency mismatch',
      timing: '< 50ms',
    },
    {
      label: 'Route Comparison',
      sublabel: 'Card: $60/3 days vs Stablecoin: $5/3 sec',
      timing: '< 100ms',
    },
    {
      label: 'FX Conversion',
      sublabel: 'Lock rate, convert to FIUSD',
      timing: '< 100ms',
    },
    {
      label: 'On-Chain Transfer',
      sublabel: 'FIUSD on Solana',
      timing: '~400ms',
    },
    {
      label: 'USD Settlement',
      sublabel: 'INDX -> merchant bank',
      timing: '~3 seconds',
    },
  ];

  return (
    <div className="workflow-content">
      <section className="docs-section">
        <h2>End-to-End Workflow</h2>
        <p>
          From an international buyer clicking "Pay" to the US merchant receiving USD in their
          bank account, the entire flow completes in under 4 seconds with a 91%+ fee reduction
          compared to traditional card rails.
        </p>
        <WorkflowDiagram steps={steps} />
      </section>

      <section className="docs-section mt-xl">
        <h2>Before vs. After</h2>
        <div className="comparison-panels">
          <div className="comparison-panel comparison-panel--before">
            <div className="comparison-panel__header">Before: Traditional Card Rails</div>
            <ul className="comparison-panel__list">
              <li>
                <span className="comparison-panel__label">Total Fee ($1,000 txn)</span>
                <span className="comparison-panel__value comparison-panel__value--bad">$47.50 - $60.00</span>
              </li>
              <li>
                <span className="comparison-panel__label">FX Markup</span>
                <span className="comparison-panel__value comparison-panel__value--bad">2.5% hidden</span>
              </li>
              <li>
                <span className="comparison-panel__label">Settlement Time</span>
                <span className="comparison-panel__value comparison-panel__value--bad">3 business days</span>
              </li>
              <li>
                <span className="comparison-panel__label">Intermediaries</span>
                <span className="comparison-panel__value comparison-panel__value--bad">4 (issuer, network, acquirer, FX)</span>
              </li>
              <li>
                <span className="comparison-panel__label">Rate Transparency</span>
                <span className="comparison-panel__value comparison-panel__value--bad">None</span>
              </li>
            </ul>
          </div>
          <div className="comparison-panel comparison-panel--after">
            <div className="comparison-panel__header">After: Fiserv FIUSD Rails</div>
            <ul className="comparison-panel__list">
              <li>
                <span className="comparison-panel__label">Total Fee ($1,000 txn)</span>
                <span className="comparison-panel__value comparison-panel__value--good">$5.00</span>
              </li>
              <li>
                <span className="comparison-panel__label">FX Rate</span>
                <span className="comparison-panel__value comparison-panel__value--good">Real-time market rate</span>
              </li>
              <li>
                <span className="comparison-panel__label">Settlement Time</span>
                <span className="comparison-panel__value comparison-panel__value--good">3.2 seconds</span>
              </li>
              <li>
                <span className="comparison-panel__label">Intermediaries</span>
                <span className="comparison-panel__value comparison-panel__value--good">0 (direct P2P)</span>
              </li>
              <li>
                <span className="comparison-panel__label">Rate Transparency</span>
                <span className="comparison-panel__value comparison-panel__value--good">Full visibility</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="comparison-bottom-line">
          <span className="comparison-bottom-line__label">On a $1,000 cross-border transaction:</span>
          <span className="comparison-bottom-line__value">$55.00 saved, 99.99% faster settlement</span>
        </div>
      </section>

      <section className="docs-section mt-xl">
        <h2>Step-by-Step Detail</h2>
        <div className="step-details">
          <div className="step-detail">
            <h4>1. International Purchase</h4>
            <p>
              A buyer in Mexico, Europe, or the UK initiates a purchase on the merchant's
              e-commerce site. They see pricing in their local currency (MXN, EUR, or GBP)
              and pay using their preferred local payment method.
            </p>
          </div>
          <div className="step-detail">
            <h4>2. Cross-Border Detection</h4>
            <p>
              CommerceHub Gateway automatically detects the cross-border nature of the transaction
              by comparing the buyer's currency to the merchant's settlement currency. When a
              mismatch is found (MXN != USD), the system identifies the specific corridor and
              evaluates optimal routing.
            </p>
          </div>
          <div className="step-detail">
            <h4>3. Route Comparison</h4>
            <p>
              The system compares two routes side by side: traditional card rails (3.5%
              processing + 2.5% FX = 6.0% total, 3-day settlement) versus stablecoin rails
              (0.5% all-in, 3-second settlement). The stablecoin route is automatically
              selected when the savings exceed the minimum threshold.
            </p>
          </div>
          <div className="step-detail">
            <h4>4. FX Conversion</h4>
            <p>
              The FX engine aggregates rates from multiple sources, applies a minimal spread,
              and locks the conversion rate for a 30-second execution window. The buyer's local
              currency is converted to FIUSD at this locked rate, eliminating the hidden FX
              markups that card networks apply.
            </p>
          </div>
          <div className="step-detail">
            <h4>5. On-Chain Transfer</h4>
            <p>
              The FIUSD is transferred from the buyer's escrow to the merchant's wallet on
              Solana. This on-chain transfer confirms in approximately 400 milliseconds,
              providing an immutable audit trail of the payment.
            </p>
          </div>
          <div className="step-detail">
            <h4>6. USD Settlement</h4>
            <p>
              INDX converts the merchant's FIUSD to USD and initiates settlement to their
              bank account. The merchant receives real US dollars in approximately 3 seconds.
              They do not interact with stablecoins or blockchain directly -- it is abstracted
              away entirely.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
