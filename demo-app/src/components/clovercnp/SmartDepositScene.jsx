import { useState } from 'react';
import ShowcaseSection from '../showcase/ShowcaseSection';
import SimulatedUI from '../showcase/SimulatedUI';
import DemoSequence from '../showcase/DemoSequence';

const DEPOSIT_STEPS = [
  {
    icon: '\u{1F4F1}',
    label: 'Apple Intelligence user: "Book a deep-tissue massage for Saturday 2pm"',
    type: 'action',
  },
  {
    icon: '\u{1F50D}',
    label: "Clover Merchant Directory: matched 'Blue Orchid Spa' (downtown, 4.9\u2605)",
    type: 'system',
  },
  {
    icon: '\u{1F4C5}',
    label: "Blue Orchid calendar: Saturday 2pm is open with Ming",
    type: 'system',
  },
  {
    icon: '\u{1F512}',
    label: 'Deposit rule: $50 required (refundable up to 24h before)',
    type: 'system',
  },
  {
    icon: '\u270D\uFE0F',
    label: 'Mastercard Agent Pay: signing cryptographic mandate',
    detail: 'booking_id + amount + cancellation_window + customer_consent',
    type: 'action',
  },
  {
    icon: '\u2705',
    label: 'Deposit locked. Booking confirmed.',
    detail: 'Mandate stored as dispute-evidence packet (instrumentation only)',
    type: 'result',
  },
];

export default function SmartDepositScene() {
  const [done, setDone] = useState(false);

  return (
    <ShowcaseSection id="smart-deposit">
      {(isVisible) => (
        <>
          {/* ACT 1: Problem */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            SmartDeposit
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            <span className="sc-highlight">10-20%</span> of services bookings
            are no-shows.
            <br />
            Every empty chair on Saturday is revenue that walked out.
          </h2>

          {/* ACT 2: Split demo — AI booking + merchant dashboard */}
          <div
            className="sc-split sc-reveal sc-reveal-3"
            style={{ marginTop: '2.5rem' }}
          >
            {/* Left: Apple Intelligence booking flow */}
            <SimulatedUI title="Apple Intelligence — Booking Flow">
              <DemoSequence
                isActive={isVisible}
                intervalMs={1800}
                steps={DEPOSIT_STEPS}
                onComplete={() => setDone(true)}
              />
            </SimulatedUI>

            {/* Right: Blue Orchid Spa dashboard */}
            <SimulatedUI title="Blue Orchid Spa — Clover Dashboard">
              {done ? (
                <div className="sc-fade-in">
                  {/* Hero stat */}
                  <div
                    style={{
                      padding: '1rem',
                      background: 'rgba(0, 200, 83, 0.08)',
                      border: '1px solid rgba(0, 200, 83, 0.25)',
                      borderRadius: '10px',
                      textAlign: 'center',
                      marginBottom: '1rem',
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
                      Saturday 2026-04-11
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        color: 'var(--sc-green)',
                        fontWeight: 700,
                        marginTop: '0.35rem',
                      }}
                    >
                      Fully booked. Zero no-shows.
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--sc-text-secondary)',
                        marginTop: '0.25rem',
                      }}
                    >
                      12 of 12 bookings protected by deposit
                    </div>
                  </div>

                  {/* Booking list */}
                  <div
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--sc-text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Today's bookings
                  </div>
                  {[
                    { time: '10:00', name: 'Chen', service: 'Swedish', status: 'deposit' },
                    { time: '11:30', name: 'Ortiz', service: 'Hot stone', status: 'deposit' },
                    { time: '14:00', name: 'New (via AI)', service: 'Deep tissue', status: 'new' },
                    { time: '15:30', name: 'Park', service: 'Facial', status: 'deposit' },
                  ].map((b) => (
                    <div
                      key={b.time}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.82rem',
                        background:
                          b.status === 'new'
                            ? 'rgba(255, 102, 0, 0.06)'
                            : 'transparent',
                        borderLeft:
                          b.status === 'new'
                            ? '2px solid var(--sc-accent)'
                            : '2px solid transparent',
                      }}
                    >
                      <span style={{ color: 'var(--sc-text-muted)', minWidth: '40px' }}>
                        {b.time}
                      </span>
                      <span style={{ color: 'var(--sc-text)' }}>
                        {b.name}
                        <span
                          style={{
                            color: 'var(--sc-text-muted)',
                            marginLeft: '0.5rem',
                          }}
                        >
                          • {b.service}
                        </span>
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color:
                            b.status === 'new'
                              ? 'var(--sc-accent)'
                              : 'var(--sc-green)',
                          fontWeight: 600,
                        }}
                      >
                        {b.status === 'new' ? '+ JUST BOOKED' : '$50 locked'}
                      </span>
                    </div>
                  ))}

                  {/* Instrumentation note */}
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--sc-bg-card)',
                      border: '1px solid var(--sc-border)',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: 'var(--sc-text-muted)',
                    }}
                  >
                    <strong style={{ color: 'var(--sc-teal)' }}>Dispute mandate:</strong>{' '}
                    captured for each deposit. Win-rate lift pending 6 months of data
                    (per Phase 4 holdback).
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
                  Awaiting booking...
                </div>
              )}
            </SimulatedUI>
          </div>

          {/* ACT 3 */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">Zero no-shows</div>
            <div className="sc-result-label">
              One click. Deposit locked. Same backbone as Clover Direct.
            </div>
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
