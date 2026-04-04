import React, { useState, useEffect, useRef } from 'react';

/**
 * Visual animation of the x402 payment flow for demo purposes.
 * Shows the step-by-step process of how an agent pays a merchant.
 */

const STEPS = [
  {
    id: 'request',
    label: 'Agent Request',
    description: 'Agent sends GET /api/products/:id',
    icon: 'A',
    color: '#58a6ff',
  },
  {
    id: '402',
    label: 'HTTP 402',
    description: 'Gateway returns Payment Required with X-PAYMENT instructions',
    icon: '402',
    color: '#d29922',
  },
  {
    id: 'sign',
    label: 'Sign Payment',
    description: 'Agent signs EIP-3009 authorization with wallet keypair',
    icon: 'S',
    color: '#bc8cff',
  },
  {
    id: 'verify',
    label: 'Verify',
    description: 'Verifier checks signature, KYC tier, and spending limits',
    icon: 'V',
    color: '#79c0ff',
  },
  {
    id: 'settle',
    label: 'On-Chain Settle',
    description: 'Settler executes token transfer on Solana/Base',
    icon: 'TX',
    color: '#3fb950',
  },
  {
    id: 'receipt',
    label: 'Receipt',
    description: 'Cryptographic receipt returned with resource access',
    icon: 'R',
    color: '#3fb950',
  },
];

const styles = {
  container: {
    background: '#161b22',
    borderRadius: '12px',
    border: '1px solid #30363d',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e1e4e8',
  },
  playBtn: (playing) => ({
    padding: '6px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    background: playing ? '#21262d' : '#238636',
    color: '#fff',
  }),
  timeline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    position: 'relative',
    padding: '20px 0',
  },
  step: (active, completed) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    opacity: completed || active ? 1 : 0.3,
    transition: 'opacity 0.3s',
  }),
  stepCircle: (active, completed, color) => ({
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'monospace',
    background: completed ? color : active ? `${color}33` : '#21262d',
    color: completed ? '#fff' : active ? color : '#484f58',
    border: `2px solid ${active ? color : completed ? color : '#30363d'}`,
    transition: 'all 0.3s',
    zIndex: 1,
    boxShadow: active ? `0 0 12px ${color}44` : 'none',
  }),
  stepLabel: (active) => ({
    fontSize: '11px',
    fontWeight: active ? '600' : '400',
    color: active ? '#e1e4e8' : '#8b949e',
    marginTop: '8px',
    textAlign: 'center',
  }),
  connector: (completed) => ({
    flex: 1,
    height: '2px',
    background: completed ? '#3fb950' : '#21262d',
    transition: 'background 0.3s',
    marginTop: '-22px',
  }),
  description: {
    marginTop: '16px',
    padding: '12px 16px',
    background: '#0d1117',
    borderRadius: '8px',
    border: '1px solid #21262d',
    fontSize: '13px',
    color: '#c9d1d9',
    textAlign: 'center',
    minHeight: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default function AgentPaymentFlow() {
  const [activeStep, setActiveStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  const play = () => {
    setPlaying(true);
    setActiveStep(0);

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= STEPS.length) {
        clearInterval(intervalRef.current);
        setPlaying(false);
        setTimeout(() => setActiveStep(-1), 2000);
        return;
      }
      setActiveStep(step);
    }, 1500);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    setPlaying(false);
    setActiveStep(-1);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>x402 Payment Flow</span>
        <button
          style={styles.playBtn(playing)}
          onClick={playing ? stop : play}
        >
          {playing ? 'Stop' : 'Play Animation'}
        </button>
      </div>

      <div style={styles.timeline}>
        {STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <div style={styles.step(activeStep === i, activeStep > i)}>
              <div
                style={styles.stepCircle(
                  activeStep === i,
                  activeStep > i,
                  step.color
                )}
              >
                {step.icon}
              </div>
              <div style={styles.stepLabel(activeStep === i)}>
                {step.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={styles.connector(activeStep > i)} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={styles.description}>
        {activeStep >= 0 && activeStep < STEPS.length
          ? STEPS[activeStep].description
          : 'Click "Play Animation" to see the x402 payment flow'}
      </div>
    </div>
  );
}
