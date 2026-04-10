import { useState } from 'react';
import ShowcaseSection from '../showcase/ShowcaseSection';
import SimulatedUI from '../showcase/SimulatedUI';
import DemoSequence from '../showcase/DemoSequence';

/**
 * CloverDirectScene — hero scene of the Clover-CNP showcase.
 *
 * Story beats:
 *  1. Customer asks ChatGPT for pizza.
 *  2. ChatGPT finds Luigi's Pizzeria via the Clover Merchant Directory.
 *  3. Clover Agent Checkout backbone (reshaped prototype-2) receives ACP intent.
 *  4. Agent Order Translation Layer converts intent -> Clover Platform API order.
 *  5. Luigi's POS rings with a full ticket: pepperoni, extra cheese, garlic knots, tip, delivery.
 *  6. Merchant dashboard shows 8% all-in vs DoorDash's 28% — merchant saves $6.06 on a $30 order.
 */

const PIPELINE_STEPS = [
  {
    icon: '\u{1F4AC}',
    label: 'ChatGPT user: "Order a large pepperoni from a pizza place near me"',
    type: 'action',
  },
  {
    icon: '\u{1F50D}',
    label: "Clover Merchant Directory: matched 'Luigi's Pizzeria' (0.4 mi, 4.8\u2605)",
    type: 'system',
  },
  {
    icon: '\u{1F4E5}',
    label: 'ACP intent payload received via Clover Agent Checkout Gateway',
    detail: 'protocol: acp / version: 2026-01-30',
    type: 'system',
  },
  {
    icon: '\u{1F504}',
    label: 'Agent Order Translation Layer \u2192 Clover Platform API order',
    detail: 'line items, modifiers, tip, delivery mapped (confidence: high)',
    type: 'action',
  },
  {
    icon: '\u{1F4B3}',
    label: 'Mastercard Agent Pay token verified \u2014 cryptographic mandate stored',
    type: 'system',
  },
  {
    icon: '\u2705',
    label: "Ticket landed on Luigi's POS (latency: 3.2s)",
    detail: 'Settlement: FIUSD-backed via Finxact + INDX',
    type: 'result',
  },
];

export default function CloverDirectScene() {
  const [done, setDone] = useState(false);

  return (
    <ShowcaseSection id="clover-direct">
      {(isVisible) => (
        <>
          {/* ACT 1: Problem */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            Clover Direct
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            DoorDash takes <span className="sc-highlight">28%</span>.
            <br />
            Uber Eats takes 25-30%.
            <br />
            Toast charges merchants to beat them. Clover doesn't.
          </h2>

          {/* ACT 2: Split-screen demo — agent pipeline + Luigi's POS */}
          <div
            className="sc-split sc-reveal sc-reveal-3"
            style={{ marginTop: '2.5rem' }}
          >
            {/* Left: Agent pipeline */}
            <SimulatedUI title="Clover Agent Checkout Gateway">
              <DemoSequence
                isActive={isVisible}
                intervalMs={1800}
                steps={PIPELINE_STEPS}
                onComplete={() => setDone(true)}
              />
            </SimulatedUI>

            {/* Right: Luigi's POS receipt */}
            <SimulatedUI title="Luigi's Pizzeria — Clover Station">
              {done ? (
                <div className="sc-fade-in">
                  <div
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderBottom: '1px dashed var(--sc-border)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--sc-text-muted)',
                      }}
                    >
                      New Order — Delivery — from AI agent (ChatGPT)
                    </div>
                    <div
                      style={{
                        fontSize: '1rem',
                        color: 'var(--sc-text)',
                        marginTop: '0.35rem',
                      }}
                    >
                      Order #AGT-4081 • Requested 7:30pm
                    </div>
                  </div>

                  {/* Line items */}
                  {[
                    {
                      name: 'Large Pepperoni Pizza',
                      mod: 'Extra cheese \u2022 Thin crust',
                      price: '$19.99',
                    },
                    { name: 'Garlic Knots (6)', mod: '', price: '$5.99' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        padding: '0.5rem 0.5rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--sc-text)' }}>{item.name}</div>
                        {item.mod && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--sc-text-muted)',
                              marginTop: '0.15rem',
                            }}
                          >
                            {item.mod}
                          </div>
                        )}
                      </div>
                      <div style={{ color: 'var(--sc-text)', fontWeight: 500 }}>
                        {item.price}
                      </div>
                    </div>
                  ))}

                  {/* Totals */}
                  <div
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px dashed var(--sc-border)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {[
                      { label: 'Subtotal', value: '$25.98' },
                      { label: 'Delivery', value: '$2.99' },
                      { label: 'Tax', value: '$2.31' },
                      { label: 'Tip (18%)', value: '$4.32' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.15rem 0.5rem',
                          color: 'var(--sc-text-secondary)',
                        }}
                      >
                        <span>{row.label}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        marginTop: '0.25rem',
                        background: 'rgba(0, 200, 83, 0.08)',
                        borderRadius: '6px',
                        color: 'var(--sc-green)',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      <span>Total</span>
                      <span>$35.60</span>
                    </div>
                  </div>

                  {/* Take-rate comparison */}
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '0.85rem',
                      background: 'var(--sc-bg-card)',
                      border: '1px solid var(--sc-border)',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--sc-text-muted)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Merchant Take-Rate
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: 'var(--sc-red)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span>Via DoorDash (28%)</span>
                      <span>$9.97 fee</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: 'var(--sc-green)',
                      }}
                    >
                      <span>Via Clover Direct (8%)</span>
                      <span>$2.85 fee</span>
                    </div>
                    <div
                      style={{
                        marginTop: '0.5rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--sc-border)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: 'var(--sc-accent)',
                      }}
                    >
                      Luigi saves $7.12 on this order
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '280px',
                    color: 'var(--sc-text-muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  Awaiting agent order...
                </div>
              )}
            </SimulatedUI>
          </div>

          {/* ACT 3: Result */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">8% &nbsp;vs&nbsp; 28%</div>
            <div className="sc-result-label">
              Every Clover restaurant. Every AI agent. Ready today.
            </div>
          </div>

          {/* Kill threshold — Taleb discipline on the record */}
          <div
            className="sc-reveal sc-reveal-6"
            style={{
              maxWidth: '720px',
              margin: '2.5rem auto 0',
              padding: '1rem 1.25rem',
              background: 'rgba(255, 102, 0, 0.05)',
              border: '1px dashed rgba(255, 102, 0, 0.3)',
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
                color: 'var(--sc-accent)',
                fontWeight: 700,
                fontSize: '0.7rem',
              }}
            >
              Kill threshold
            </span>
            <span style={{ marginLeft: '0.75rem' }}>
              &lt; $50M annualized agent-channel GPV by Q4 2026 → product dies,
              rails absorbed into generic acceptance
            </span>
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
