import { useState } from 'react';
import ShowcaseSection from '../showcase/ShowcaseSection';
import SimulatedUI from '../showcase/SimulatedUI';
import DemoSequence from '../showcase/DemoSequence';

/**
 * SupplierPayScene — the outflow-side companion to WeekendCash.
 *
 * Reshape of prototype-3 Supplier Pay. The Phase 4 verdict had retired P3 as
 * "B2B, not CNP" — but the Phase 6 reframe is that merchant cash-cycle savings
 * are a retention lever that makes the CNP pitch stickier. Same code, new
 * narrative: WeekendCash on the inflow, SupplierCash on the outflow.
 */

const INVENTORY_ITEMS = [
  { name: 'Flour (50lb)', fill: 72, status: 'ok' },
  { name: 'Chicken Breast', fill: 15, status: 'critical' },
  { name: 'Mozzarella', fill: 10, status: 'critical' },
  { name: 'Olive Oil', fill: 55, status: 'ok' },
  { name: 'Tomato Sauce', fill: 38, status: 'low' },
];

const PIPELINE_STEPS = [
  {
    icon: '\u{1F534}',
    label: 'ALERT: chicken_breast — 2 days until stockout',
    type: 'system',
  },
  {
    icon: '\u{1F534}',
    label: 'ALERT: mozzarella — 1.5 days until stockout',
    type: 'system',
  },
  {
    icon: '\u{1F916}',
    label: 'AI Procurement Agent: generating grouped PO...',
    type: 'action',
  },
  {
    icon: '\u{1F4CB}',
    label: 'PO #1247: Fresh Foods Inc. — chicken 50lb ($225) + mozzarella 30lb ($112.50)',
    type: 'system',
  },
  {
    icon: '\u{1F4B0}',
    label: 'Early-pay discount 2%: -$6.75 → Net: $330.75',
    type: 'action',
  },
  {
    icon: '\u26A1',
    label: 'Paying $330.75 FIUSD via Finxact → INDX',
    type: 'action',
  },
  {
    icon: '\u2705',
    label: 'Supplier received $330.75 USD in 2.7 seconds',
    detail: 'Card fees eliminated: $9.79 • Discount captured: $6.75',
    type: 'result',
  },
];

export default function SupplierPayScene() {
  const [done, setDone] = useState(false);

  return (
    <ShowcaseSection id="supplier-cash">
      {(isVisible) => (
        <>
          {/* ACT 1: Problem — framed as the outflow companion */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            SupplierCash
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            WeekendCash gives Luigi his Saturday money on Saturday.
            <br />
            SupplierCash saves him{' '}
            <span className="sc-highlight">$1,200 every month</span>
            <br />
            on the <span className="sc-highlight">other side</span> of his ledger.
          </h2>

          {/* ACT 2: Split demo — inventory + pipeline */}
          <div
            className="sc-split sc-reveal sc-reveal-3"
            style={{ marginTop: '2.5rem' }}
          >
            {/* Left: inventory state */}
            <SimulatedUI title="Luigi's Pizzeria — Clover POS Inventory">
              <div className="sc-inventory" style={{ marginBottom: '1rem' }}>
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
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--sc-text-muted)',
                  fontStyle: 'italic',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--sc-border)',
                }}
              >
                BOM mapped from 30 days of Clover POS sales data.
              </div>
            </SimulatedUI>

            {/* Right: procurement + payment pipeline */}
            <SimulatedUI title="SupplierCash Procurement Agent">
              <DemoSequence
                isActive={isVisible}
                intervalMs={1800}
                steps={PIPELINE_STEPS}
                onComplete={() => setDone(true)}
              />
              {done && (
                <div
                  className="sc-fade-in"
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem 1rem',
                    background:
                      'linear-gradient(135deg, rgba(0, 200, 83, 0.08), rgba(255, 102, 0, 0.05))',
                    border: '1px solid rgba(0, 200, 83, 0.3)',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--sc-text-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Rolling 30 days
                  </div>
                  <div
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--sc-green)',
                    }}
                  >
                    +$1,247.30 captured
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--sc-text-secondary)',
                      marginTop: '0.2rem',
                    }}
                  >
                    Card fees eliminated + early-pay discounts captured
                  </div>
                </div>
              )}
            </SimulatedUI>
          </div>

          {/* ACT 3: Result + retention framing */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">$1,200/month</div>
            <div className="sc-result-label">
              Same merchant. Same rails. Outflow side of the cash cycle.
            </div>
          </div>

          {/* Retention framing panel — why this belongs in the CNP portfolio */}
          <div
            className="sc-reveal sc-reveal-6"
            style={{
              maxWidth: '780px',
              margin: '2rem auto 0',
              padding: '1rem 1.25rem',
              background: 'rgba(0, 188, 212, 0.05)',
              border: '1px dashed rgba(0, 188, 212, 0.3)',
              borderRadius: '10px',
              fontSize: '0.85rem',
              color: 'var(--sc-text-secondary)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--sc-teal)',
                fontWeight: 700,
                fontSize: '0.7rem',
                marginRight: '0.6rem',
              }}
            >
              Retention play
            </span>
            Not CNP revenue. Every dollar Clover preserves on the supplier side
            makes the CNP pitch stickier. WeekendCash + SupplierCash = Clover owns
            the merchant's entire cash cycle.
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
