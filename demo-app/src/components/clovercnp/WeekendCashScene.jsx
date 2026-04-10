import { useState } from 'react';
import ShowcaseSection from '../showcase/ShowcaseSection';
import SimulatedUI from '../showcase/SimulatedUI';
import DemoSequence from '../showcase/DemoSequence';

const TIMELINE_STEPS = [
  {
    icon: '\u{1F35D}',
    label: 'Friday 11:00 PM \u2014 Luigi\'s closes. Weekend card volume: $8,420',
    type: 'system',
  },
  {
    icon: '\u{1F4C5}',
    label: 'Normal T+1 ACH: funds land Tuesday afternoon',
    type: 'system',
  },
  {
    icon: '\u{1F6E1}\uFE0F',
    label: 'WeekendCash decision gate: eligibility = OK (Friday 11:30 PM)',
    detail: 'Conservative ramp: tier 100% (90-day graduation complete)',
    type: 'action',
  },
  {
    icon: '\u{1F504}',
    label: 'Finxact advance: $8,420 \u2192 INDX \u2192 Luigi\'s account',
    detail: 'Funded from Fiserv balance sheet (internal float)',
    type: 'action',
  },
  {
    icon: '\u{1F4B0}',
    label: 'Saturday 6:00 AM \u2014 Money landed.',
    type: 'result',
  },
  {
    icon: '\u{1F4C9}',
    label: 'Monday/Tuesday \u2014 card settlement clears, reconcile runs',
    detail: 'Merchant sees nothing. Float cost absorbed by Fiserv.',
    type: 'system',
  },
];

export default function WeekendCashScene() {
  const [done, setDone] = useState(false);

  return (
    <ShowcaseSection id="weekend-cash">
      {(isVisible) => (
        <>
          {/* ACT 1: Problem */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            WeekendCash
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            Luigi closes Friday at 11pm.
            <br />
            His weekend money arrives{' '}
            <span className="sc-highlight">Tuesday afternoon</span>.
            <br />
            He pays Sunday's prep from Friday's reserves.
          </h2>

          {/* ACT 2: Split demo — pipeline + Luigi's account */}
          <div
            className="sc-split sc-reveal sc-reveal-3"
            style={{ marginTop: '2.5rem' }}
          >
            {/* Left: WeekendCash pipeline */}
            <SimulatedUI title="WeekendCash Pipeline (reshape of prototype-1)">
              <DemoSequence
                isActive={isVisible}
                intervalMs={1900}
                steps={TIMELINE_STEPS}
                onComplete={() => setDone(true)}
              />
            </SimulatedUI>

            {/* Right: Luigi's bank view */}
            <SimulatedUI title="Luigi's Finxact Account">
              {done ? (
                <div className="sc-fade-in">
                  {/* The moment */}
                  <div
                    style={{
                      padding: '1.25rem',
                      background:
                        'linear-gradient(135deg, rgba(255, 102, 0, 0.10), rgba(0, 200, 83, 0.10))',
                      border: '1px solid var(--sc-accent)',
                      borderRadius: '12px',
                      textAlign: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: 'var(--sc-text-muted)',
                      }}
                    >
                      Saturday 6:00 AM
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        color: 'var(--sc-accent)',
                        fontWeight: 800,
                        marginTop: '0.5rem',
                      }}
                    >
                      +$8,420.00
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--sc-text)',
                        marginTop: '0.35rem',
                      }}
                    >
                      Weekend revenue — landed.
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: '0.75rem',
                        padding: '0.3rem 0.7rem',
                        background: 'rgba(255, 102, 0, 0.15)',
                        border: '1px solid rgba(255, 102, 0, 0.4)',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        color: 'var(--sc-accent)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      ★ Backed by Fiserv
                    </div>
                  </div>

                  {/* Comparison row */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--sc-bg-card)',
                      border: '1px solid var(--sc-border)',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--sc-text-muted)',
                        marginBottom: '0.45rem',
                      }}
                    >
                      Vs. the alternatives
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        color: 'var(--sc-red)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span>T+1 ACH (default)</span>
                      <span>Tuesday afternoon</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        color: 'var(--sc-red)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span>Stripe Instant Payout</span>
                      <span>1.5% fee</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        color: 'var(--sc-red)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span>Square Instant Transfer</span>
                      <span>1.75% fee</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--sc-border)',
                        fontSize: '0.88rem',
                        color: 'var(--sc-green)',
                        fontWeight: 700,
                      }}
                    >
                      <span>WeekendCash</span>
                      <span>Free • Saturday 6am</span>
                    </div>
                  </div>

                  {/* Safeguards */}
                  <div
                    style={{
                      padding: '0.7rem 0.85rem',
                      background: 'rgba(0, 188, 212, 0.06)',
                      border: '1px solid rgba(0, 188, 212, 0.3)',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      color: 'var(--sc-text-secondary)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--sc-teal)',
                        fontWeight: 700,
                        marginBottom: '0.35rem',
                      }}
                    >
                      Taleb safeguards (hard-wired)
                    </div>
                    60-min Fiserv backstop on miss&nbsp;•&nbsp;99.9% auto-pause
                    SLA&nbsp;•&nbsp;Conservative 90-day ramp
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
                  Awaiting Friday close...
                </div>
              )}
            </SimulatedUI>
          </div>

          {/* ACT 3 */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">Saturday money, on Saturday</div>
            <div className="sc-result-label">
              Backed by Fiserv. No fee. No wait. No stablecoin in the pitch.
            </div>
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
