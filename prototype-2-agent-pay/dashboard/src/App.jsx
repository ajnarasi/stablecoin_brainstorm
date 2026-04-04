import React, { useState } from 'react';
import TransactionList from './components/TransactionList';
import TransactionDetail from './components/TransactionDetail';
import AgentPaymentFlow from './components/AgentPaymentFlow';
import RevenueChart from './components/RevenueChart';
import { useTransactions, useGatewayStatus } from './hooks/useTransactions';

const styles = {
  app: {
    minHeight: '100vh',
    background: '#0d1117',
    color: '#e1e4e8',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderBottom: '1px solid #21262d',
    background: '#161b22',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #58a6ff, #bc8cff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '600',
  },
  logoBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '12px',
    background: 'rgba(56,139,253,0.15)',
    color: '#58a6ff',
    border: '1px solid rgba(56,139,253,0.3)',
    fontWeight: '500',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusDot: (connected) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: connected ? '#3fb950' : '#f85149',
  }),
  statusText: {
    fontSize: '13px',
    color: '#8b949e',
  },
  main: {
    padding: '24px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#161b22',
    borderRadius: '12px',
    border: '1px solid #30363d',
    padding: '16px 20px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#8b949e',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: (color) => ({
    fontSize: '28px',
    fontWeight: '700',
    fontFamily: 'monospace',
    color: color || '#e1e4e8',
  }),
  statSub: {
    fontSize: '12px',
    color: '#484f58',
    marginTop: '4px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '24px',
    marginBottom: '24px',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#3fb950',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#3fb950',
    animation: 'pulse 2s infinite',
  },
};

// Inject keyframe animation
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;
document.head.appendChild(pulseStyle);

export default function App() {
  const {
    allTransactions,
    agentTransactions,
    cardTransactions,
    summary,
    loading,
    error,
  } = useTransactions();

  const gatewayStatus = useGatewayStatus();
  const [selectedTxn, setSelectedTxn] = useState(null);

  const isConnected = !!gatewayStatus?.health;
  const totalRevenue =
    (summary?.totalAgentRevenue || 0) +
    cardTransactions.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>F</div>
          <span style={styles.logoText}>Fiserv CommerceHub</span>
          <span style={styles.logoBadge}>x402 Prototype</span>
        </div>
        <div style={styles.statusBar}>
          <div style={styles.liveIndicator}>
            <span style={styles.liveDot} />
            Live
          </div>
          <span style={styles.statusDot(isConnected)} />
          <span style={styles.statusText}>
            Gateway {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {gatewayStatus?.x402 && (
            <span style={{ ...styles.statusText, color: '#58a6ff' }}>
              {gatewayStatus.x402.protocol} v{gatewayStatus.x402.version}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Revenue</div>
            <div style={styles.statValue('#e1e4e8')}>
              ${totalRevenue.toFixed(2)}
            </div>
            <div style={styles.statSub}>All payment methods</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Agent Revenue</div>
            <div style={styles.statValue('#58a6ff')}>
              ${(summary?.totalAgentRevenue || 0).toFixed(2)}
            </div>
            <div style={styles.statSub}>
              {summary?.totalAgentCount || 0} transactions
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Card Revenue</div>
            <div style={styles.statValue('#8b949e')}>
              $
              {cardTransactions
                .reduce((s, t) => s + parseFloat(t.amount || 0), 0)
                .toFixed(2)}
            </div>
            <div style={styles.statSub}>
              {cardTransactions.length} transactions
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Transactions</div>
            <div style={styles.statValue('#3fb950')}>
              {allTransactions.length}
            </div>
            <div style={styles.statSub}>
              Agent: {agentTransactions.length} | Card:{' '}
              {cardTransactions.length}
            </div>
          </div>
        </div>

        {/* Transaction List + Detail */}
        <div style={styles.contentGrid}>
          <TransactionList
            transactions={allTransactions}
            onSelectTransaction={setSelectedTxn}
            selectedId={selectedTxn?.id}
          />
          <TransactionDetail transaction={selectedTxn} />
        </div>

        {/* Flow Animation + Revenue Chart */}
        <div style={styles.bottomGrid}>
          <AgentPaymentFlow />
          <RevenueChart
            agentTransactions={agentTransactions}
            cardTransactions={cardTransactions}
            summary={summary}
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(248,81,73,0.1)',
              border: '1px solid rgba(248,81,73,0.3)',
              borderRadius: '8px',
              color: '#f85149',
              fontSize: '13px',
            }}
          >
            Gateway connection error: {error}. Make sure the gateway is running
            on port 8002.
          </div>
        )}
      </main>
    </div>
  );
}
