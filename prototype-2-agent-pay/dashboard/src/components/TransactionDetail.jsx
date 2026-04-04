import React from 'react';

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
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#e1e4e8',
  },
  badge: (type) => ({
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    background: type === 'agent' ? 'rgba(56,139,253,0.15)' : 'rgba(139,148,158,0.15)',
    color: type === 'agent' ? '#58a6ff' : '#8b949e',
    border: `1px solid ${type === 'agent' ? 'rgba(56,139,253,0.3)' : 'rgba(139,148,158,0.3)'}`,
  }),
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#8b949e',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  field: {
    background: '#0d1117',
    borderRadius: '8px',
    padding: '10px 12px',
    border: '1px solid #21262d',
  },
  fieldLabel: {
    fontSize: '11px',
    color: '#8b949e',
    marginBottom: '4px',
  },
  fieldValue: {
    fontSize: '14px',
    color: '#c9d1d9',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  link: {
    color: '#58a6ff',
    textDecoration: 'none',
    fontSize: '14px',
    fontFamily: 'monospace',
  },
  statusBar: (status) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    background: status === 'settled' ? 'rgba(63,185,80,0.1)' : 'rgba(210,153,34,0.1)',
    border: `1px solid ${status === 'settled' ? 'rgba(63,185,80,0.3)' : 'rgba(210,153,34,0.3)'}`,
    color: status === 'settled' ? '#3fb950' : '#d29922',
    fontSize: '14px',
    fontWeight: '500',
  }),
  dot: (color) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: color,
  }),
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#484f58',
    fontSize: '14px',
  },
};

export default function TransactionDetail({ transaction }) {
  if (!transaction) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          Select a transaction to view details
        </div>
      </div>
    );
  }

  const isAgent = transaction.type === 'agent';
  const receipt = transaction.receipt || {};
  const statusColor = transaction.status === 'settled' ? '#3fb950' : '#d29922';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>{transaction.productName || 'Transaction'}</div>
          <div style={{ color: '#8b949e', fontSize: '13px', marginTop: '4px' }}>
            {new Date(transaction.timestamp).toLocaleString()}
          </div>
        </div>
        <span style={styles.badge(transaction.type)}>
          {isAgent ? 'Agent (x402)' : 'Card Payment'}
        </span>
      </div>

      <div style={styles.statusBar(transaction.status)}>
        <span style={styles.dot(statusColor)} />
        {transaction.status === 'settled' ? 'Settlement Complete' : 'Pending Settlement'}
      </div>

      {/* Payment Info */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Payment Details</div>
        <div style={styles.grid}>
          <div style={styles.field}>
            <div style={styles.fieldLabel}>Amount</div>
            <div style={{ ...styles.fieldValue, color: '#3fb950', fontSize: '18px' }}>
              ${transaction.amount}
            </div>
          </div>
          <div style={styles.field}>
            <div style={styles.fieldLabel}>
              {isAgent ? 'Token / Chain' : 'Card'}
            </div>
            <div style={styles.fieldValue}>
              {isAgent
                ? `${transaction.token} / ${transaction.chain}`
                : `${transaction.cardType?.toUpperCase()} ****${transaction.last4}`}
            </div>
          </div>
          {isAgent && (
            <>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Payment Method</div>
                <div style={styles.fieldValue}>EIP-3009</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Agent Tier</div>
                <div style={styles.fieldValue}>
                  {(transaction.agentTier || 'basic').toUpperCase()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* On-Chain Receipt (Agent payments only) */}
      {isAgent && receipt.receiptId && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>On-Chain Receipt</div>
          <div style={styles.grid}>
            <div style={{ ...styles.field, ...styles.fullWidth }}>
              <div style={styles.fieldLabel}>Receipt ID</div>
              <div style={styles.fieldValue}>{receipt.receiptId}</div>
            </div>
            <div style={{ ...styles.field, ...styles.fullWidth }}>
              <div style={styles.fieldLabel}>Transaction Hash</div>
              <div style={styles.fieldValue}>
                {transaction.transactionId || receipt.transactionId}
              </div>
            </div>
            <div style={styles.field}>
              <div style={styles.fieldLabel}>Agent ID</div>
              <div style={styles.fieldValue}>{transaction.agentId}</div>
            </div>
            <div style={styles.field}>
              <div style={styles.fieldLabel}>Order ID</div>
              <div style={styles.fieldValue}>{transaction.orderId}</div>
            </div>
            <div style={{ ...styles.field, ...styles.fullWidth }}>
              <div style={styles.fieldLabel}>Receipt Signature</div>
              <div style={{ ...styles.fieldValue, fontSize: '12px' }}>
                {receipt.signature}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Info */}
      {isAgent && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Settlement</div>
          <div style={styles.grid}>
            <div style={styles.field}>
              <div style={styles.fieldLabel}>Chain</div>
              <div style={styles.fieldValue}>
                {transaction.chain === 'solana' ? 'Solana (Devnet)' : 'Base (Sepolia)'}
              </div>
            </div>
            <div style={styles.field}>
              <div style={styles.fieldLabel}>Explorer</div>
              <a
                href={
                  transaction.chain === 'solana'
                    ? `https://explorer.solana.com/tx/${transaction.transactionId}?cluster=devnet`
                    : `https://sepolia.basescan.org/tx/${transaction.transactionId}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                View on {transaction.chain === 'solana' ? 'Solana Explorer' : 'BaseScan'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
