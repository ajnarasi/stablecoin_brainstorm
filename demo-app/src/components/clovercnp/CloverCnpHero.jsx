import ShowcaseSection from '../showcase/ShowcaseSection';

/**
 * CloverCnpHero — opening slide for the Clover-CNP showcase.
 *
 * Frames the narrative: Clover is card-present heavy, Toast/Shopify lead
 * on conventional CNP, but Fiserv+Clover is *ahead* on agentic rails
 * because of the December 2025 Mastercard Agent Pay integration.
 */
export default function CloverCnpHero() {
  return (
    <ShowcaseSection id="cnp-hero">
      {(isVisible, hasBeenVisible) => (
        <>
          <h2
            className="sc-problem sc-reveal sc-reveal-1"
            style={{ textAlign: 'center', margin: '2rem auto' }}
          >
            Clover is <span className="sc-highlight">card-present heavy</span>.
            <br />
            Toast owns restaurant e-comm. Shopify owns retail.
            <br />
            Square owns onboarding.
          </h2>

          <h2
            className="sc-problem sc-reveal sc-reveal-3"
            style={{
              textAlign: 'center',
              margin: '3rem auto 2rem',
              color: 'var(--sc-text)',
            }}
          >
            But Fiserv is the <span className="sc-highlight">only SMB acquirer</span>
            <br />
            whose{' '}
            <span className="sc-highlight">6&nbsp;million&nbsp;merchants</span>{' '}
            are ready for
            <br />
            AI agent payments <span className="sc-highlight">today</span>.
          </h2>

          {/* Asymmetry proof — 4-column comparison */}
          <div
            className="sc-reveal sc-reveal-5"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.25rem',
              maxWidth: '980px',
              margin: '3rem auto 0',
            }}
          >
            {[
              { name: 'Clover', label: 'Mastercard Agent Pay', value: 'Live Dec 2025', accent: true },
              { name: 'Toast', label: 'Agentic commerce', value: 'None' },
              { name: 'Square', label: 'Agentic commerce', value: 'None' },
              { name: 'Shopify POS', label: 'ACP (Shopify online)', value: 'Not POS' },
            ].map((box) => (
              <div
                key={box.name}
                style={{
                  padding: '1.25rem 1rem',
                  background: box.accent
                    ? 'var(--sc-accent-glow)'
                    : 'var(--sc-bg-card)',
                  border: `1px solid ${
                    box.accent ? 'var(--sc-accent)' : 'var(--sc-border)'
                  }`,
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--sc-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '0.5rem',
                  }}
                >
                  {box.label}
                </div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--sc-text)',
                    marginBottom: '0.35rem',
                  }}
                >
                  {box.name}
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: box.accent ? 'var(--sc-accent)' : 'var(--sc-text-muted)',
                    fontWeight: box.accent ? 700 : 400,
                  }}
                >
                  {box.value}
                </div>
              </div>
            ))}
          </div>

          <div
            className="sc-reveal sc-reveal-6"
            style={{
              textAlign: 'center',
              marginTop: '3rem',
              color: 'var(--sc-text-secondary)',
              fontSize: '0.95rem',
              maxWidth: '720px',
              margin: '3rem auto 0',
            }}
          >
            The bet: skip the catch-up generation. Define the next one.
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
