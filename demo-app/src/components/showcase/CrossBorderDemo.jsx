import ShowcaseSection from './ShowcaseSection';

export default function CrossBorderDemo() {
  return (
    <ShowcaseSection id="cross-border">
      {(isVisible, hasBeenVisible) => (
        <>
          {/* ACT 1: Problem */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            Cross-Border Settlement
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            <span className="sc-highlight">$190 trillion</span> market.
            <br />
            5-9% in fees. 3-day settlement. 4 intermediaries.
          </h2>

          {/* Transaction context */}
          <p
            className="sc-reveal sc-reveal-2"
            style={{
              textAlign: 'center',
              color: 'var(--sc-text-secondary)',
              fontSize: '1rem',
              marginTop: '1.5rem',
              marginBottom: '2.5rem',
            }}
          >
            Carlos Rodriguez (Mexico) purchases from GlobalTech Store (US)
            &mdash; 17,500 MXN (~$1,000 USD)
          </p>

          {/* ACT 2: Comparison panels */}
          <div className="sc-comparison">
            {/* Left panel: Traditional */}
            <div
              className={`sc-comparison__panel sc-comparison__panel--bad ${
                hasBeenVisible ? 'sc-slide-left' : ''
              }`}
              style={{ animationDelay: '1s' }}
            >
              <div className="sc-comparison__header sc-comparison__header--bad">
                Traditional Card Rails
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">Processing Fee</span>
                <span className="sc-comparison__value sc-comparison__value--bad">
                  $35.00 (3.5%)
                </span>
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">FX Markup</span>
                <span className="sc-comparison__value sc-comparison__value--bad">
                  $25.00 (2.5%)
                </span>
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">Total Fee</span>
                <span className="sc-comparison__value sc-comparison__value--bad">
                  $60.00 (6.0%)
                </span>
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">Settlement</span>
                <span className="sc-comparison__value sc-comparison__value--bad">
                  3 business days
                </span>
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">Intermediaries</span>
                <span
                  className="sc-comparison__value sc-comparison__value--bad"
                  style={{ fontSize: '0.8rem' }}
                >
                  4 (Issuer &rarr; Network &rarr; Acquirer &rarr; FX)
                </span>
              </div>
            </div>

            {/* Center: Savings punch */}
            <div
              className={`sc-comparison__center ${
                hasBeenVisible ? 'sc-fade-in' : ''
              }`}
              style={{ animationDelay: '2.5s' }}
            >
              <div
                style={{
                  fontSize: '4.5rem',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  background: 'linear-gradient(135deg, var(--sc-accent), #ff8a50)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                }}
              >
                $55
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--sc-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginTop: '0.25rem',
                }}
              >
                Saved
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--sc-text-secondary)',
                  marginTop: '0.5rem',
                }}
              >
                91.7% reduction
              </div>
            </div>

            {/* Right panel: FIUSD */}
            <div
              className={`sc-comparison__panel sc-comparison__panel--good ${
                hasBeenVisible ? 'sc-slide-right' : ''
              }`}
              style={{ animationDelay: '1.5s' }}
            >
              <div className="sc-comparison__header sc-comparison__header--good">
                Fiserv FIUSD Rails
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">FX Conversion</span>
                <span className="sc-comparison__value sc-comparison__value--good">
                  Real-time (Solana)
                </span>
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">Processing Fee</span>
                <span className="sc-comparison__value sc-comparison__value--good">
                  $5.00 (0.5%)
                </span>
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">Total Fee</span>
                <span className="sc-comparison__value sc-comparison__value--good">
                  $5.00 (0.5%)
                </span>
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">Settlement</span>
                <span className="sc-comparison__value sc-comparison__value--good">
                  3 seconds
                </span>
              </div>
              <div className="sc-comparison__row">
                <span className="sc-comparison__label">Intermediaries</span>
                <span className="sc-comparison__value sc-comparison__value--good">
                  0 (Direct peer-to-peer)
                </span>
              </div>
            </div>
          </div>

          {/* ACT 3: Result */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">3 seconds</div>
            <div className="sc-result-label">
              Cross-border payments. Instant. 90% cheaper.
            </div>
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
