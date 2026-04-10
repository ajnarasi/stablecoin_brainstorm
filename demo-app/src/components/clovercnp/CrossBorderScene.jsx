import { useState } from 'react';
import ShowcaseSection from '../showcase/ShowcaseSection';
import SimulatedUI from '../showcase/SimulatedUI';
import DemoSequence from '../showcase/DemoSequence';

/**
 * CrossBorderScene — the silent international lane under Clover Direct.
 *
 * Reshape of prototype-4 Cross-Border. Phase 4 retired P4 as "CommerceHub
 * enterprise, not Clover SMB". Phase 6 reframe: when an AI agent in Mexico
 * City orders from Luigi's in NYC, the transaction is already agentic AND
 * already cross-border. Clover Agent Checkout Backbone handles the currency
 * mismatch silently — no new product, no new integration, rides the same rails.
 */

const PIPELINE_STEPS = [
  {
    icon: '\u{1F4AC}',
    label: 'ChatGPT user (Mexico City): "Order pepperoni pizza from Luigi\'s NYC"',
    type: 'action',
  },
  {
    icon: '\u{1F4E5}',
    label: 'Agent intent arrives at Clover Agent Checkout Gateway',
    detail: 'currency: MXN • amount: 649.00',
    type: 'system',
  },
  {
    icon: '\u{1F30D}',
    label: 'International Lane detects currency mismatch (MXN ≠ USD)',
    type: 'system',
  },
  {
    icon: '\u{1F512}',
    label: 'FX engine locks rate: 1 USD = 16.23 MXN (30-sec hold)',
    type: 'action',
  },
  {
    icon: '\u{1F6E1}\uFE0F',
    label: 'OFAC + GENIUS Act compliance screen: PASSED',
    type: 'system',
  },
  {
    icon: '\u26A1',
    label: 'FIUSD conversion on Solana → INDX settlement',
    type: 'action',
  },
  {
    icon: '\u2705',
    label: 'Luigi credited $40.00 USD in 3 seconds (vs $35.80 — 3 days)',
    detail: 'Silent to merchant, silent to agent, no extra integration',
    type: 'result',
  },
];

export default function CrossBorderScene() {
  const [done, setDone] = useState(false);

  return (
    <ShowcaseSection id="international-lane">
      {(isVisible, hasBeenVisible) => (
        <>
          {/* ACT 1: Problem framing */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            International Lane
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            A ChatGPT user in Mexico City orders from Luigi's in NYC.
            <br />
            That transaction is <span className="sc-highlight">already agentic</span>.
            <br />
            And it's <span className="sc-highlight">already cross-border</span>.
          </h2>

          {/* ACT 2: Comparison + pipeline */}
          <div
            className="sc-split sc-reveal sc-reveal-3"
            style={{ marginTop: '2.5rem' }}
          >
            {/* Left: silent pipeline */}
            <SimulatedUI title="Clover Agent Checkout — International Lane">
              <DemoSequence
                isActive={isVisible}
                intervalMs={1750}
                steps={PIPELINE_STEPS}
                onComplete={() => setDone(true)}
              />
            </SimulatedUI>

            {/* Right: side-by-side cost comparison */}
            <SimulatedUI title="Merchant Cost Comparison — $1,000 international order">
              {done ? (
                <div className="sc-fade-in">
                  {/* Bad path */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(255, 23, 68, 0.05)',
                      border: '1px solid rgba(255, 23, 68, 0.25)',
                      borderRadius: '8px',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--sc-red)',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                      }}
                    >
                      Traditional card rails
                    </div>
                    {[
                      { label: 'Processing fee', value: '$35.00 (3.5%)' },
                      { label: 'FX markup', value: '$25.00 (2.5%)' },
                      { label: 'Settlement', value: '3 business days' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                          color: 'var(--sc-text-secondary)',
                          padding: '0.15rem 0',
                        }}
                      >
                        <span>{row.label}</span>
                        <span style={{ color: 'var(--sc-red)' }}>{row.value}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.4rem',
                        marginTop: '0.4rem',
                        borderTop: '1px solid rgba(255, 23, 68, 0.2)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--sc-red)',
                      }}
                    >
                      <span>Total merchant cost</span>
                      <span>$60.00</span>
                    </div>
                  </div>

                  {/* Good path */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(0, 200, 83, 0.08)',
                      border: '1px solid rgba(0, 200, 83, 0.3)',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--sc-green)',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                      }}
                    >
                      International Lane (FIUSD + INDX)
                    </div>
                    {[
                      { label: 'FX conversion', value: 'Real-time (Solana)' },
                      { label: 'Total fee', value: '$5.00 (0.5%)' },
                      { label: 'Settlement', value: '3 seconds' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                          color: 'var(--sc-text-secondary)',
                          padding: '0.15rem 0',
                        }}
                      >
                        <span>{row.label}</span>
                        <span style={{ color: 'var(--sc-green)' }}>{row.value}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.4rem',
                        marginTop: '0.4rem',
                        borderTop: '1px solid rgba(0, 200, 83, 0.2)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--sc-green)',
                      }}
                    >
                      <span>Total merchant cost</span>
                      <span>$5.00</span>
                    </div>
                  </div>

                  {/* Savings punch */}
                  <div
                    style={{
                      marginTop: '0.85rem',
                      textAlign: 'center',
                      fontSize: '0.95rem',
                      color: 'var(--sc-accent)',
                      fontWeight: 700,
                    }}
                  >
                    Luigi saves $55 on this order • 91.7% reduction
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
                  Awaiting international order...
                </div>
              )}
            </SimulatedUI>
          </div>

          {/* ACT 3: Result */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">$55 saved per $1,000</div>
            <div className="sc-result-label">
              Every Clover Direct merchant. No extra integration. Rides the same backbone.
            </div>
          </div>

          {/* Same-backbone callout */}
          <div
            className="sc-reveal sc-reveal-6"
            style={{
              maxWidth: '780px',
              margin: '2rem auto 0',
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
                marginRight: '0.6rem',
              }}
            >
              Same backbone
            </span>
            No new product. No new integration. Lives inside Clover Agent Checkout
            Backbone. When Clover Direct ships, International Lane ships with it.
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
