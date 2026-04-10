import ShowcaseSection from '../showcase/ShowcaseSection';

/**
 * CloverCnpClosing — the kill-threshold / portfolio discipline slide.
 *
 * Panel unanimous on "every shipped product has a public kill threshold."
 * This scene is the via-negativa framing: the kills are as important as the ships.
 */
export default function CloverCnpClosing() {
  return (
    <ShowcaseSection id="cnp-closing">
      {() => (
        <>
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            Portfolio Discipline
          </p>

          <h2
            className="sc-problem sc-reveal sc-reveal-1"
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            Every product has a{' '}
            <span className="sc-highlight">public kill threshold</span>.
            <br />
            We know how we'd know we were wrong.
          </h2>

          {/* Survivors table */}
          <div
            className="sc-reveal sc-reveal-3"
            style={{
              maxWidth: '980px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--sc-text-muted)',
                marginBottom: '0.75rem',
              }}
            >
              In scope — build portfolio
            </div>
            {[
              {
                name: 'Clover Direct',
                tag: 'HERO',
                threshold:
                  '< $50M annualized agent-channel GPV by Q4 2026',
              },
              {
                name: 'SmartDeposit',
                tag: 'CAPABILITY',
                threshold:
                  'Dispute win-rate lift < 10pp after 6 months of data \u2192 claim held',
              },
              {
                name: 'WeekendCash',
                tag: 'RESHAPE of P1',
                threshold:
                  '< 99.9% rolling 30-day SLA \u2192 auto-pause',
              },
              {
                name: 'Clover Agent Checkout backbone',
                tag: 'RESHAPE of P2',
                threshold:
                  'Agent Order Translation Layer < 95% confidence on demo fixtures',
              },
              {
                name: 'SupplierCash',
                tag: 'RESHAPE of P3',
                threshold:
                  '< $800/mo average captured discount per enrolled merchant → product retires',
              },
              {
                name: 'International Lane',
                tag: 'RESHAPE of P4',
                threshold:
                  '< 2% of Clover Direct order flow is cross-border → capability stays silent',
              },
            ].map((row) => (
              <div
                key={row.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  background: 'var(--sc-bg-card)',
                  border: '1px solid var(--sc-border)',
                  borderRadius: '10px',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '4px',
                    background: 'var(--sc-accent-glow)',
                    color: 'var(--sc-accent)',
                  }}
                >
                  {row.tag}
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    color: 'var(--sc-text)',
                    fontWeight: 600,
                  }}
                >
                  {row.name}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--sc-text-secondary)',
                    fontFamily: 'monospace',
                  }}
                >
                  {row.threshold}
                </div>
              </div>
            ))}

            {/* Kills */}
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--sc-text-muted)',
                marginTop: '2rem',
                marginBottom: '0.75rem',
              }}
            >
              Explored and parked — via negativa discipline
            </div>
            {[
              {
                name: 'Clover Net-Zero',
                tag: 'KILL',
                reason:
                  'Competitive parity with Stripe/Square Invoicing. Folded as feature layer.',
              },
            ].map((row) => (
              <div
                key={row.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '1rem',
                  alignItems: 'start',
                  padding: '0.85rem 1.25rem',
                  background: 'rgba(255, 23, 68, 0.04)',
                  border: '1px solid rgba(255, 23, 68, 0.2)',
                  borderRadius: '10px',
                  marginBottom: '0.55rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '4px',
                    background: 'rgba(255, 23, 68, 0.12)',
                    color: 'var(--sc-red)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.tag}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.92rem',
                      color: 'var(--sc-text)',
                      fontWeight: 600,
                      marginBottom: '0.2rem',
                    }}
                  >
                    {row.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--sc-text-muted)' }}>
                    {row.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Closing line */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div
              className="sc-result-label"
              style={{ fontSize: '1.1rem', fontStyle: 'italic' }}
            >
              "The discipline of the kills is the signal. The ships are the product."
            </div>
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
