import React from 'react';

/**
 * Revenue comparison chart: Agent payments vs Card payments
 * Uses pure CSS/HTML bars since we want zero extra dependencies.
 */

const styles = {
  container: {
    background: '#161b22',
    borderRadius: '12px',
    border: '1px solid #30363d',
    padding: '20px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e1e4e8',
    marginBottom: '20px',
  },
  chartArea: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-end',
    padding: '20px 0',
    minHeight: '200px',
  },
  barGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  bar: (height, color) => ({
    width: '60px',
    height: `${Math.max(height, 4)}px`,
    background: `linear-gradient(180deg, ${color}, ${color}88)`,
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.5s ease',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  }),
  barValue: {
    position: 'absolute',
    top: '-24px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#e1e4e8',
  },
  barLabel: {
    fontSize: '12px',
    color: '#8b949e',
    fontWeight: '500',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #21262d',
  },
  stat: {
    textAlign: 'center',
  },
  statValue: (color) => ({
    fontSize: '20px',
    fontWeight: '700',
    fontFamily: 'monospace',
    color: color || '#e1e4e8',
  }),
  statLabel: {
    fontSize: '11px',
    color: '#8b949e',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '16px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#8b949e',
  },
  legendDot: (color) => ({
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    background: color,
  }),
};

export default function RevenueChart({ agentTransactions, cardTransactions, summary }) {
  const agentTotal = summary?.totalAgentRevenue || 0;
  const cardTotal = cardTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amount || 0),
    0
  );
  const total = agentTotal + cardTotal;
  const maxVal = Math.max(agentTotal, cardTotal, 1);
  const maxBarHeight = 160;

  // Per-token breakdown
  const tokenBreakdown = {};
  agentTransactions.forEach((t) => {
    const key = `${t.token || 'FIUSD'}`;
    tokenBreakdown[key] = (tokenBreakdown[key] || 0) + parseFloat(t.amount || 0);
  });

  // Per-chain breakdown
  const chainBreakdown = {};
  agentTransactions.forEach((t) => {
    const key = t.chain || 'solana';
    chainBreakdown[key] = (chainBreakdown[key] || 0) + parseFloat(t.amount || 0);
  });

  const agentPct = total > 0 ? ((agentTotal / total) * 100).toFixed(1) : '0.0';

  return (
    <div style={styles.container}>
      <div style={styles.title}>Revenue Comparison</div>

      <div style={styles.chartArea}>
        {/* Agent revenue bar */}
        <div style={styles.barGroup}>
          <div style={styles.bar((agentTotal / maxVal) * maxBarHeight, '#58a6ff')}>
            <span style={styles.barValue}>${agentTotal.toFixed(2)}</span>
          </div>
          <div style={styles.barLabel}>Agent (x402)</div>
        </div>

        {/* Per-token bars */}
        {Object.entries(tokenBreakdown).map(([token, amount]) => (
          <div key={token} style={styles.barGroup}>
            <div
              style={styles.bar(
                (amount / maxVal) * maxBarHeight,
                token === 'FIUSD' ? '#bc8cff' : '#79c0ff'
              )}
            >
              <span style={styles.barValue}>${amount.toFixed(2)}</span>
            </div>
            <div style={styles.barLabel}>{token}</div>
          </div>
        ))}

        {/* Card revenue bar */}
        <div style={styles.barGroup}>
          <div style={styles.bar((cardTotal / maxVal) * maxBarHeight, '#8b949e')}>
            <span style={styles.barValue}>${cardTotal.toFixed(2)}</span>
          </div>
          <div style={styles.barLabel}>Card</div>
        </div>
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={styles.legendDot('#58a6ff')} />
          Agent Payments
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendDot('#bc8cff')} />
          FIUSD
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendDot('#79c0ff')} />
          USDC
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendDot('#8b949e')} />
          Card
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <div style={styles.statValue('#58a6ff')}>
            {summary?.totalAgentCount || 0}
          </div>
          <div style={styles.statLabel}>Agent Txns</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statValue('#3fb950')}>{agentPct}%</div>
          <div style={styles.statLabel}>Agent Share</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statValue('#e1e4e8')}>
            ${summary?.averageAgentAmount || '0.00'}
          </div>
          <div style={styles.statLabel}>Avg Agent Txn</div>
        </div>
      </div>
    </div>
  );
}
