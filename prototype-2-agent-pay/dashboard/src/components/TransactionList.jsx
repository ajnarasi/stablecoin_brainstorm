import React, { useState } from 'react';

const styles = {
  container: {
    background: '#161b22',
    borderRadius: '12px',
    border: '1px solid #30363d',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #30363d',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e1e4e8',
  },
  filterGroup: {
    display: 'flex',
    gap: '8px',
  },
  filterBtn: (active) => ({
    padding: '4px 12px',
    borderRadius: '16px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    background: active ? '#1f6feb' : '#21262d',
    color: active ? '#fff' : '#8b949e',
  }),
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px 20px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#8b949e',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #21262d',
  },
  td: {
    padding: '12px 20px',
    fontSize: '14px',
    borderBottom: '1px solid #21262d',
    color: '#c9d1d9',
  },
  row: (selected) => ({
    cursor: 'pointer',
    background: selected ? '#1c2333' : 'transparent',
    transition: 'background 0.15s',
  }),
  badge: (type) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    background: type === 'agent' ? 'rgba(56,139,253,0.15)' : 'rgba(139,148,158,0.15)',
    color: type === 'agent' ? '#58a6ff' : '#8b949e',
    border: `1px solid ${type === 'agent' ? 'rgba(56,139,253,0.3)' : 'rgba(139,148,158,0.3)'}`,
  }),
  statusDot: (status) => ({
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '6px',
    background: status === 'settled' ? '#3fb950' : status === 'pending' ? '#d29922' : '#f85149',
  }),
  amount: {
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#3fb950',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#8b949e',
  },
};

export default function TransactionList({ transactions, onSelectTransaction, selectedId }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Recent Transactions</span>
        <div style={styles.filterGroup}>
          {['all', 'agent', 'card'].map((f) => (
            <button
              key={f}
              style={styles.filterBtn(filter === f)}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'agent' ? 'Agent (x402)' : 'Card'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          No transactions yet. Run the demo agent to generate x402 payments.
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((txn) => (
              <tr
                key={txn.id}
                style={styles.row(selectedId === txn.id)}
                onClick={() => onSelectTransaction(txn)}
                onMouseEnter={(e) => {
                  if (selectedId !== txn.id) e.currentTarget.style.background = '#1c2333';
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== txn.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <td style={styles.td}>
                  <span style={styles.badge(txn.type)}>
                    {txn.type === 'agent' ? 'Agent' : 'Card'}
                  </span>
                </td>
                <td style={styles.td}>{txn.productName || 'N/A'}</td>
                <td style={{ ...styles.td, ...styles.amount }}>${txn.amount}</td>
                <td style={styles.td}>
                  <span style={styles.statusDot(txn.status)} />
                  {txn.status}
                </td>
                <td style={styles.td}>{formatTime(txn.timestamp)}</td>
                <td style={styles.td}>
                  {txn.type === 'agent' ? (
                    <span style={{ fontSize: '12px', color: '#8b949e' }}>
                      {txn.token}/{txn.chain} | {txn.agentTier || 'basic'}
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#8b949e' }}>
                      {txn.cardType} ****{txn.last4}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
