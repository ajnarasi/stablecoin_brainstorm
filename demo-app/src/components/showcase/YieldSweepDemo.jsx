import { useState } from 'react';
import ShowcaseSection from './ShowcaseSection';
import SimulatedUI from './SimulatedUI';
import DemoSequence from './DemoSequence';

const STEPS = [
  {
    icon: '\u{1F3EA}',
    label: "Mario's Pizzeria \u2014 Settlement Balance: $23,450.00",
    type: 'system',
  },
  {
    icon: '\u{1F916}',
    label: 'AI Treasury Agent: Analyzing 180 days of transaction history...',
    type: 'action',
  },
  {
    icon: '\u{1F4CA}',
    label: '3-day predicted outflows: $15,200.00 (confidence: 87%)',
    type: 'system',
  },
  {
    icon: '\u{1F6E1}\uFE0F',
    label: 'Decision Gate: Hard floor $18,240 | Excess: $5,210 | Ramp 15%',
    type: 'system',
  },
  {
    icon: '\u{1F4B0}',
    label: 'Sweeping $781.50 to FIUSD yield position at 4.2% APY',
    type: 'action',
  },
  {
    icon: '\u2705',
    label: 'APPROVED \u2014 Position transferred via Finxact',
    detail: 'INDX settlement confirmed',
    type: 'result',
  },
  {
    icon: '\u{1F4C8}',
    label: 'Dashboard updated: "$847 earned this month"',
    detail: 'Projected annual: $10,164',
    type: 'result',
  },
];

export default function YieldSweepDemo() {
  const [sequenceComplete, setSequenceComplete] = useState(false);

  return (
    <ShowcaseSection id="yield-sweep">
      {(isVisible, hasBeenVisible) => (
        <>
          {/* ACT 1: Problem */}
          <p className="sc-demo-title sc-reveal" style={{ textAlign: 'center' }}>
            Merchant Yield Sweep
          </p>
          <h2 className="sc-problem sc-reveal sc-reveal-1">
            Your merchants have{' '}
            <span className="sc-highlight">$150 billion</span> sitting idle in
            settlement accounts.
            <br />
            Earning <span className="sc-highlight">nothing</span>.
          </h2>

          {/* ACT 2: Simulated Demo */}
          <div
            className="sc-reveal sc-reveal-3"
            style={{ marginTop: '2.5rem' }}
          >
            <SimulatedUI title="Clover Merchant Dashboard \u2014 Mario's Pizzeria">
              <DemoSequence
                isActive={isVisible}
                intervalMs={2000}
                steps={STEPS}
                onComplete={() => setSequenceComplete(true)}
              />
              {/* Yield widget appears after completion */}
              {sequenceComplete && (
                <div className="sc-widget sc-fade-in" style={{ marginTop: '1.5rem' }}>
                  <div className="sc-widget__value">$847.00</div>
                  <div className="sc-widget__label">
                    Yield earned this month \u2014 4.2% APY on idle balances
                  </div>
                </div>
              )}
            </SimulatedUI>
          </div>

          {/* ACT 3: Result */}
          <div
            className="sc-result sc-reveal sc-reveal-5"
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div className="sc-result-metric">$847/month</div>
            <div className="sc-result-label">
              earned automatically. One toggle in Clover.
            </div>
          </div>
        </>
      )}
    </ShowcaseSection>
  );
}
