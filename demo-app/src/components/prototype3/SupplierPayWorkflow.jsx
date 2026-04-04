import WorkflowDiagram from '../shared/WorkflowDiagram';

export default function SupplierPayWorkflow() {
  const steps = [
    {
      label: 'Sales Data',
      sublabel: 'Clover POS tracks every sale',
      timing: 'Real-time',
    },
    {
      label: 'BOM Mapping',
      sublabel: 'Pizza -> 0.5lb flour + 0.3lb mozz + ...',
      timing: 'Instant',
    },
    {
      label: 'Depletion Prediction',
      sublabel: 'ML model: chicken runs out Thursday',
      timing: '< 1 second',
    },
    {
      label: 'PO Generation',
      sublabel: 'Auto-create orders, enforce MOQs',
      timing: '< 1 second',
    },
    {
      label: 'Instant FIUSD Payment',
      sublabel: 'Finxact merchant-to-supplier transfer',
      timing: '< 500ms',
    },
    {
      label: 'USD Settlement',
      sublabel: 'INDX: supplier receives dollars',
      timing: '~3 seconds',
    },
  ];

  return (
    <div className="workflow-content">
      <section className="docs-section">
        <h2>End-to-End Workflow</h2>
        <p>
          From a pizza sale at the register to the supplier receiving USD payment, the entire
          process is automated and settles in under 5 seconds.
        </p>
        <WorkflowDiagram steps={steps} />
      </section>

      <section className="docs-section mt-xl">
        <h2>Before vs. After</h2>
        <div className="comparison-panels">
          <div className="comparison-panel comparison-panel--before">
            <div className="comparison-panel__header">Before: Traditional Card Payments</div>
            <ul className="comparison-panel__list">
              <li>
                <span className="comparison-panel__label">Monthly Card Fees</span>
                <span className="comparison-panel__value comparison-panel__value--bad">$1,450</span>
              </li>
              <li>
                <span className="comparison-panel__label">Missed Early-Pay Discounts</span>
                <span className="comparison-panel__value comparison-panel__value--bad">$1,000/mo</span>
              </li>
              <li>
                <span className="comparison-panel__label">Settlement Time</span>
                <span className="comparison-panel__value comparison-panel__value--bad">3-5 days</span>
              </li>
              <li>
                <span className="comparison-panel__label">Stockout Risk</span>
                <span className="comparison-panel__value comparison-panel__value--bad">High (manual ordering)</span>
              </li>
              <li>
                <span className="comparison-panel__label">Monthly Waste</span>
                <span className="comparison-panel__value comparison-panel__value--bad">$2,500+</span>
              </li>
            </ul>
          </div>
          <div className="comparison-panel comparison-panel--after">
            <div className="comparison-panel__header">After: AI + FIUSD Payments</div>
            <ul className="comparison-panel__list">
              <li>
                <span className="comparison-panel__label">Monthly Payment Fees</span>
                <span className="comparison-panel__value comparison-panel__value--good">$50</span>
              </li>
              <li>
                <span className="comparison-panel__label">Early-Pay Discounts Captured</span>
                <span className="comparison-panel__value comparison-panel__value--good">$1,000/mo</span>
              </li>
              <li>
                <span className="comparison-panel__label">Settlement Time</span>
                <span className="comparison-panel__value comparison-panel__value--good">~3 seconds</span>
              </li>
              <li>
                <span className="comparison-panel__label">Stockout Risk</span>
                <span className="comparison-panel__value comparison-panel__value--good">Near zero (AI predicted)</span>
              </li>
              <li>
                <span className="comparison-panel__label">Monthly Savings</span>
                <span className="comparison-panel__value comparison-panel__value--good">$1,200+ saved</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="docs-section mt-xl">
        <h2>Step-by-Step Detail</h2>
        <div className="step-details">
          <div className="step-detail">
            <h4>1. Sales Data Ingestion</h4>
            <p>
              Every transaction on the Clover POS is captured in real-time. The system tracks
              which menu items sell, quantities, and timing patterns. This data feeds into the
              BOM engine to calculate ingredient consumption rates.
            </p>
          </div>
          <div className="step-detail">
            <h4>2. BOM Mapping</h4>
            <p>
              The Bill of Materials maps each menu item to its raw ingredient components. When
              a Large Margherita Pizza sells, the system automatically deducts 0.5lb flour,
              0.3lb mozzarella, 0.2lb tomato sauce, and other ingredients from virtual
              inventory.
            </p>
          </div>
          <div className="step-detail">
            <h4>3. Depletion Prediction</h4>
            <p>
              A gradient-boosted ML model uses 30 days of consumption data with day-of-week
              features to predict when each ingredient will hit its reorder point. The model
              achieves 92% accuracy within a 0.5-day margin.
            </p>
          </div>
          <div className="step-detail">
            <h4>4. PO Generation</h4>
            <p>
              When an ingredient is predicted to deplete within its lead time window, the
              procurement agent automatically generates a purchase order. Orders are grouped
              by supplier, minimum order quantities are enforced, and optimal quantities are
              calculated.
            </p>
          </div>
          <div className="step-detail">
            <h4>5. Instant FIUSD Payment</h4>
            <p>
              Instead of paying by card (2.9% fee), the merchant pays the supplier instantly
              in FIUSD through Finxact. The payment settles in under a second on the ledger,
              qualifying for the supplier's early-pay discount (typically 2% for payment
              within 24 hours).
            </p>
          </div>
          <div className="step-detail">
            <h4>6. USD Settlement</h4>
            <p>
              INDX converts the FIUSD to USD and settles to the supplier's bank account in
              approximately 3 seconds. The supplier receives real dollars, not crypto -- they
              do not need to understand stablecoins.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
