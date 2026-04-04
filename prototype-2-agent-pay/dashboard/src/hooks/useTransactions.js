import { useState, useEffect, useCallback, useRef } from 'react';

const GATEWAY_URL = 'http://localhost:8002';
const POLL_INTERVAL = 5000;

/**
 * Hook to fetch and poll transaction data from the gateway
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState({
    agentTransactions: [],
    cardTransactions: [],
    summary: {
      totalAgentRevenue: 0,
      totalAgentCount: 0,
      averageAgentAmount: '0.00',
    },
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`${GATEWAY_URL}/api/x402/transactions`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    intervalRef.current = setInterval(fetchTransactions, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchTransactions]);

  const allTransactions = [
    ...transactions.agentTransactions.map((t) => ({ ...t, type: 'agent' })),
    ...transactions.cardTransactions.map((t) => ({ ...t, type: 'card' })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    allTransactions,
    agentTransactions: transactions.agentTransactions,
    cardTransactions: transactions.cardTransactions,
    summary: transactions.summary,
    loading,
    error,
    refresh: fetchTransactions,
  };
}

/**
 * Hook to fetch gateway status
 */
export function useGatewayStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [healthRes, x402Res] = await Promise.all([
          fetch(`${GATEWAY_URL}/health`),
          fetch(`${GATEWAY_URL}/api/x402/status`),
        ]);
        const health = await healthRes.json();
        const x402 = await x402Res.json();
        setStatus({ health, x402 });
      } catch {
        setStatus(null);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
