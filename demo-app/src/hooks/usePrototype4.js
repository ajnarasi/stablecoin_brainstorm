import { useState, useCallback } from 'react';
import { API } from '../config';

const BASE = API.p4;
const MERCHANT = 'MERCHANT_001';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function usePrototype4(addTrace) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    dashboard: null,
    transaction: null,
    comparisons: null,
    analytics: null,
    fxRates: null,
  });
  const [error, setError] = useState(null);

  const getDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', `GET /api/merchants/${MERCHANT}/dashboard`);
      const res = await fetch(`${BASE}/merchants/${MERCHANT}/dashboard`);
      if (!res.ok) throw new Error(`Dashboard failed: ${res.status}`);
      const json = await res.json();
      addTrace('result', 'Dashboard data loaded');
      setData((prev) => ({ ...prev, dashboard: json }));
      return json;
    } catch (err) {
      addTrace('error', `Dashboard failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  const seed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', 'POST /api/demo/seed');
      addTrace('system', 'Seeding GlobalTech Store with cross-border transaction history...');
      const res = await fetch(`${BASE}/demo/seed`, { method: 'POST' });
      if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
      const json = await res.json();
      // API returns: { status, total_transactions, cross_border_transactions, cross_border_pct, buyers, days }
      addTrace('system', `Seed complete: ${json.total_transactions || 'N/A'} transactions, ${json.cross_border_transactions || 'N/A'} cross-border (${json.cross_border_pct || 'N/A'}%)`);
      addTrace('result', 'Demo data seeded successfully - GlobalTech Store ready');
      setData((prev) => ({ ...prev, seed: json }));

      // Auto-fetch dashboard after seed to populate stat cards
      try {
        addTrace('api', `GET /api/merchants/${MERCHANT}/dashboard`);
        const dashRes = await fetch(`${BASE}/merchants/${MERCHANT}/dashboard`);
        if (dashRes.ok) {
          const dashJson = await dashRes.json();
          addTrace('result', 'Dashboard data loaded');
          setData((prev) => ({ ...prev, dashboard: dashJson }));
        }
      } catch (_) {
        // Dashboard fetch is best-effort after seed
      }

      return json;
    } catch (err) {
      addTrace('error', `Seed failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  const triggerLiveTransaction = useCallback(async (buyerId, amountLocal) => {
    setLoading(true);
    setError(null);
    try {
      const buyerNames = {
        BUYER_MX_001: 'Carlos Rodriguez',
        BUYER_DE_001: 'Hans Mueller',
        BUYER_GB_001: 'James Wilson',
        BUYER_US_001: 'John Smith',
      };
      const buyerCurrencies = {
        BUYER_MX_001: 'MXN',
        BUYER_DE_001: 'EUR',
        BUYER_GB_001: 'GBP',
        BUYER_US_001: 'USD',
      };
      const buyerName = buyerNames[buyerId] || buyerId;
      const buyerCurrency = buyerCurrencies[buyerId] || 'USD';

      addTrace('api', `POST /api/demo/live-transaction - Buyer: ${buyerName} (${buyerCurrency})`);
      await delay(300);

      addTrace('system', 'CommerceHub: Detecting cross-border transaction...');
      await delay(400);

      if (buyerCurrency !== 'USD') {
        addTrace('system', `Detection: Buyer currency ${buyerCurrency} != Merchant currency USD -> CROSS-BORDER`);
        addTrace('system', `Detection: Corridor identified -> ${buyerCurrency}->USD`);
      } else {
        addTrace('system', 'Detection: Domestic transaction (USD->USD) - standard processing');
      }
      await delay(300);

      const res = await fetch(`${BASE}/demo/live-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: buyerId, amount_local: parseFloat(amountLocal) }),
      });
      if (!res.ok) throw new Error(`Transaction failed: ${res.status}`);
      const json = await res.json();

      // Read from snake_case API response for trace display
      const rc = json.route_comparison || {};
      const st = json.settlement || {};

      const cardFee = Number(rc.card_fee) || 0;
      const cardFeePct = Number(rc.card_fee_pct) || 0;
      const stablecoinFee = Number(rc.stablecoin_fee) || 0;
      const stablecoinFeePct = Number(rc.stablecoin_fee_pct) || 0;
      const savingsAmount = Number(rc.savings_amount) || 0;
      const savingsPct = Number(rc.savings_pct) || 0;
      const usdAmount = Number(st.amount_usd) || 0;
      const settlementTimeSec = Number(st.settlement_time_seconds) || 0;

      const cardPctDisplay = (cardFeePct * 100).toFixed(1);
      const stablecoinPctDisplay = (stablecoinFeePct * 100).toFixed(1);

      addTrace('system', `Route Comparison: Card route = ${cardPctDisplay}% ($${cardFee.toFixed(2)})`);
      await delay(200);
      addTrace('system', `Route Comparison: Stablecoin route = ${stablecoinPctDisplay}% ($${stablecoinFee.toFixed(2)})`);
      await delay(200);
      addTrace('system', `Route Comparison: SAVINGS = $${savingsAmount.toFixed(2)} (${savingsPct.toFixed(1)}%)`);
      await delay(300);

      addTrace('system', 'Compliance: OFAC screening... PASSED');
      await delay(200);

      const txn = json.transaction || {};
      const fxRate = txn.amount_usd && txn.amount_local ? (txn.amount_usd / txn.amount_local) : 0;

      if (buyerCurrency !== 'USD' && fxRate > 0) {
        addTrace('system', `FX Engine: Locking rate ${buyerCurrency}/USD = ${fxRate.toFixed(5)} (30-second window)`);
        await delay(200);
        addTrace('system', `FX Engine: ${parseFloat(amountLocal).toLocaleString()} ${buyerCurrency} -> ${usdAmount.toFixed(2)} FIUSD (rate: ${fxRate.toFixed(5)})`);
        await delay(300);
      }

      addTrace('system', `Solana: Transferring ${usdAmount.toFixed(2)} FIUSD to merchant address...`);
      await delay(400);
      addTrace('system', 'Solana: Transaction confirmed | 400ms');
      await delay(200);

      addTrace('system', `INDX: Converting ${usdAmount.toFixed(2)} FIUSD -> $${usdAmount.toFixed(2)} USD`);
      addTrace('system', 'INDX: Settling to GlobalTech Store bank account...');
      await delay(500);

      addTrace('result', `Settlement COMPLETE | $${usdAmount.toFixed(2)} USD received`);
      addTrace('result', `Total time: ${settlementTimeSec} seconds | Fee: $${stablecoinFee.toFixed(2)} (${stablecoinPctDisplay}%) | Saved: $${savingsAmount.toFixed(2)} vs card rails`);

      // Normalize snake_case API response to camelCase for component
      const normalized = {
        ...json,
        cardRoute: {
          totalFee: cardFee,
          feePercent: cardPctDisplay,
        },
        stablecoinRoute: {
          totalFee: stablecoinFee,
          feePercent: stablecoinPctDisplay,
        },
        savings: savingsAmount,
        savingsPercent: savingsPct,
        usdAmount: usdAmount,
        settlementTime: settlementTimeSec,
        fxRate: fxRate,
      };
      setData((prev) => ({ ...prev, transaction: normalized }));
      return json;
    } catch (err) {
      addTrace('error', `Transaction failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  const getComparisons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', `GET /api/merchants/${MERCHANT}/comparisons`);
      const res = await fetch(`${BASE}/merchants/${MERCHANT}/comparisons`);
      if (!res.ok) throw new Error(`Comparisons failed: ${res.status}`);
      const json = await res.json();
      addTrace('result', 'Route comparisons loaded');
      setData((prev) => ({ ...prev, comparisons: json }));
      return json;
    } catch (err) {
      addTrace('error', `Comparisons failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  const getAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', `GET /api/merchants/${MERCHANT}/analytics`);
      const res = await fetch(`${BASE}/merchants/${MERCHANT}/analytics`);
      if (!res.ok) throw new Error(`Analytics failed: ${res.status}`);
      const json = await res.json();
      addTrace('result', 'Corridor analytics loaded');
      setData((prev) => ({ ...prev, analytics: json }));
      return json;
    } catch (err) {
      addTrace('error', `Analytics failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  const getFxRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', 'GET /api/fx/rates');
      const res = await fetch(`${BASE}/fx/rates`);
      if (!res.ok) throw new Error(`FX rates failed: ${res.status}`);
      const json = await res.json();
      addTrace('result', 'FX rates refreshed');
      setData((prev) => ({ ...prev, fxRates: json }));
      return json;
    } catch (err) {
      addTrace('error', `FX rates failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  return { seed, getDashboard, triggerLiveTransaction, getComparisons, getAnalytics, getFxRates, loading, data, error };
}
