import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * DemoSequence — auto-playing scripted step sequence.
 *
 * Renders a vertical list of steps that animate in one at a time,
 * mimicking a live system processing pipeline.
 *
 * @param {Array}    steps       Array of { icon, label, detail, type }.
 *                               type: 'action' | 'system' | 'result'
 * @param {boolean}  isActive    Starts / pauses the auto-advance timer.
 * @param {number}   intervalMs  Milliseconds between step reveals (default 1800).
 * @param {Function} onComplete  Fired once after the last step activates.
 */
export default function DemoSequence({
  steps = [],
  isActive = false,
  intervalMs = 1800,
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(-1);
  const completedRef = useRef(false);
  const timerRef = useRef(null);

  // Stable reference to onComplete so the effect doesn't re-run on every render.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Not active — leave the current visual state intact (don't reset).
    if (!isActive) {
      clearTimer();
      return;
    }

    // Already completed a full run — nothing more to do.
    if (completedRef.current) return;

    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;

        if (next >= steps.length) {
          clearTimer();
          if (!completedRef.current) {
            completedRef.current = true;
            // Defer onComplete to avoid setState-during-render
            setTimeout(() => onCompleteRef.current?.(), 0);
          }
          return prev;
        }

        return next;
      });
    }, intervalMs);

    // Reveal the first step immediately when activated for the first time.
    if (currentStep === -1) {
      setCurrentStep(0);
    }

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, steps.length, intervalMs, clearTimer]);

  // Reset when steps change (e.g. parent swaps to a different demo).
  useEffect(() => {
    setCurrentStep(-1);
    completedRef.current = false;
  }, [steps]);

  /**
   * Determine the CSS modifier class for a given step index.
   */
  function stepClass(index) {
    if (currentStep === -1) return 'sc-step--hidden';
    if (index < currentStep) return 'sc-step--done';
    if (index === currentStep) return 'sc-step--active';
    // All steps complete — show everything as done.
    if (completedRef.current) return 'sc-step--done';
    return 'sc-step--hidden';
  }

  return (
    <div className="sc-steps" role="list" aria-label="Demo sequence steps">
      {steps.map((step, i) => (
        <div
          key={`${step.label}-${i}`}
          className={`sc-step ${stepClass(i)} sc-step--type-${step.type || 'action'}`}
          role="listitem"
          aria-current={i === currentStep ? 'step' : undefined}
        >
          <span className="sc-step__icon" aria-hidden="true">
            {step.icon}
          </span>
          <div className="sc-step__content">
            <div className="sc-step__label">{step.label}</div>
            {step.detail && (
              <div className="sc-step__detail">{step.detail}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
