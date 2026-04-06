import ShowcaseSection from './ShowcaseSection';
import SimulatedUI from './SimulatedUI';
import DemoSequence from './DemoSequence';

const INVENTORY_ITEMS = [
  { name: 'Flour (50lb)', fill: 72, status: 'ok' },
  { name: 'Chicken Breast', fill: 15, status: 'critical' },
  { name: 'Mozzarella', fill: 10, status: 'critical' },
  { name: 'Olive Oil', fill: 55, status: 'ok' },
  { name: 'Tomato Sauce', fill: 38, status: 'low' },
];

const STEPS = [
  {
    icon: '\u{1F534}',
    label: 'ALERT: chicken_breast \u2014 2 days until stockout',
    type: 'system',
  },
  {
    icon: '\u{1F534}',
    label: 'ALERT: mozzarella \u2014 1.5 days until stockout',
    type: 'system',
  },
  {
    icon: '\u{1F916}',
    label: 'AI Procurement Agent: Generating purchase order...',
    type: 'action',
  },
  {
    icon: '\u{1F4CB}',
    label: 'PO #1247: Fresh Foods Inc. \u2014 chicken 50lb ($225) + mozzarella 30lb ($112.50)',
    type: 'system',
  },
  {
    icon: '\u{1F4B0}',
    label: 'Total: $337.50 \u2014 Early-pay discount 2%: -$6.75 \u2192 Net: $330.75',
    type: 'action',
  },
  {
    icon: '\u26A1',
    label: 'Paying $330.75 FIUSD via CommerceHub \u2192 Finxact \u2192 INDX',
    type: 'action',
  },
  {
    icon: '\u2705',
    label: 'Supplier received $330.75 USD in 2.7 seconds',
    type: 'result',
  },
  {
    icon: '\u{1F4B5}',
    label: 'Card fees eliminated: $9.79 | Discount captured: $6.75',
    type: 'result',
  },
];

export default function SupplierPayDemo() {
  return (
    <ShowcaseSection id="supplier-pay">
      {(isVisible) => (
        <>
          {/* ACT 1: Problem */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            Instant Supplier Pay
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            Restaurants lose{' '}
            <span className="sc-highlight">$2,500 every month</span>.
            <br />
            Card fees on supply orders. Missed early-pay discounts.
            <br />
            Suppliers waiting <span className="sc-highlight">5 days</span>.
          </h2>

          {/* ACT 2: Simulated Demo */}
          <div
            className="sc-reveal sc-reveal-3"
            style={{ marginTop: '2.5rem' }}
          >
            <SimulatedUI title="Clover POS \u2014 Mario's Pizzeria \u2014 Inventory">
              {/* Inventory grid */}
              <div className="sc-inventory" style={{ marginBottom: '1.5rem' }}>
                {INVENTORY_ITEMS.map((item) => (
                  <div className="sc-inventory__item" key={item.name}>
                    <div className="sc-inventory__name">{item.name}</div>
                    <div className="sc-inventory__bar">
                      <div
                        className={`sc-inventory__fill sc-inventory__fill--${item.status}`}
                        style={{ width: `${item.fill}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Demo sequence */}
              <DemoSequence
                isActive={isVisible}
                intervalMs={2000}
                steps={STEPS}
              />
            </SimulatedUI>
          </div>

          {/* ACT 3: Result */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">$1,200/month</div>
            <div className="sc-result-label">
              saved. Card fees eliminated. Discounts captured automatically.
            </div>
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
