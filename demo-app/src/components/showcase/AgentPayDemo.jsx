import { useState } from 'react';
import ShowcaseSection from './ShowcaseSection';
import SimulatedUI from './SimulatedUI';
import DemoSequence from './DemoSequence';

const TERMINAL_STEPS = [
  {
    icon: '\u{1F50D}',
    label: '> Agent: "Find Nike Air Max 90, size 11"',
    type: 'action',
  },
  {
    icon: '\u{1F310}',
    label: '> GET /api/products/PROD_001',
    type: 'action',
  },
  {
    icon: '\u{1F6A8}',
    label: '< HTTP 402 Payment Required',
    type: 'system',
  },
  {
    icon: '\u{1F4E6}',
    label: '> X-PAYMENT: {token: FIUSD, chain: solana, amount: 129.99}',
    type: 'system',
  },
  {
    icon: '\u{1F511}',
    label: '> Signing EIP-3009 transferWithAuthorization...',
    type: 'action',
  },
  {
    icon: '\u2705',
    label: '< HTTP 200 OK \u2014 Receipt: RCP-2026-04-001',
    type: 'result',
  },
  {
    icon: '\u23F1\uFE0F',
    label: 'Total: 2.8 seconds',
    type: 'result',
  },
];

export default function AgentPayDemo() {
  const [terminalDone, setTerminalDone] = useState(false);

  return (
    <ShowcaseSection id="agent-pay">
      {(isVisible) => (
        <>
          {/* ACT 1: Problem */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            Pay-by-Agent x402
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            AI agents can browse. They can compare.
            <br />
            But they <span className="sc-highlight">can't buy</span>.
            <br />
            Card rails require human authentication.
          </h2>

          {/* ACT 2: Split Demo */}
          <div
            className="sc-split sc-reveal sc-reveal-3"
            style={{ marginTop: '2.5rem' }}
          >
            {/* Left: Terminal */}
            <SimulatedUI title="x402 Agent Terminal">
              <DemoSequence
                isActive={isVisible}
                intervalMs={1800}
                steps={TERMINAL_STEPS}
                onComplete={() => setTerminalDone(true)}
              />
            </SimulatedUI>

            {/* Right: Merchant Dashboard */}
            <SimulatedUI title="CommerceHub Merchant Dashboard">
              {terminalDone ? (
                <div className="sc-fade-in">
                  {/* Transaction row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto',
                      gap: '1rem',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'rgba(0, 200, 83, 0.06)',
                      border: '1px solid rgba(0, 200, 83, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    <span style={{ color: 'var(--sc-teal)' }}>Agent</span>
                    <span style={{ color: 'var(--sc-text)' }}>
                      Nike Air Max 90
                    </span>
                    <span style={{ color: 'var(--sc-green)', fontWeight: 600 }}>
                      $129.99
                    </span>
                    <span
                      style={{
                        background: 'rgba(0, 200, 83, 0.15)',
                        color: 'var(--sc-green)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Settled
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--sc-text-muted)',
                      marginTop: '0.25rem',
                      paddingLeft: '1rem',
                    }}
                  >
                    FIUSD/Solana
                  </div>

                  {/* Fee comparison */}
                  <div
                    style={{
                      marginTop: '1.5rem',
                      padding: '1rem',
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
                        marginBottom: '0.75rem',
                      }}
                    >
                      Fee Comparison
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--sc-green)' }}>
                        Agent fee: $0.13 (0.1%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--sc-red)' }}>
                        Card fee: $3.77 (2.9%)
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--sc-border)',
                        fontSize: '0.85rem',
                        color: 'var(--sc-green)',
                        fontWeight: 600,
                      }}
                    >
                      Merchant saves $3.64 per transaction
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    color: 'var(--sc-text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  Awaiting transaction...
                </div>
              )}
            </SimulatedUI>
          </div>

          {/* ACT 3: Result */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">6,000,000</div>
            <div className="sc-result-label">
              merchants. Agent-payable. One software update.
            </div>
          </div>

          {/* Distribution comparison bars */}
          <div
            className="sc-reveal sc-reveal-6"
            style={{
              marginTop: '2rem',
              maxWidth: '700px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {/* Stripe bar */}
            <div style={{ marginBottom: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.35rem',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: 'var(--sc-text-secondary)' }}>Stripe</span>
                <span style={{ color: 'var(--sc-text-muted)' }}>100+ services</span>
              </div>
              <div
                style={{
                  height: '10px',
                  borderRadius: '5px',
                  background: 'var(--sc-border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '8%',
                    height: '100%',
                    borderRadius: '5px',
                    background: 'linear-gradient(90deg, #635bff, #a5a1ff)',
                  }}
                />
              </div>
            </div>

            {/* Fiserv bar */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.35rem',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: 'var(--sc-text)' }}>Fiserv</span>
                <span style={{ color: 'var(--sc-accent)', fontWeight: 600 }}>
                  6M merchants \u2014 overnight
                </span>
              </div>
              <div
                style={{
                  height: '10px',
                  borderRadius: '5px',
                  background: 'var(--sc-border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '5px',
                    background: 'linear-gradient(90deg, var(--sc-green), var(--sc-accent))',
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
