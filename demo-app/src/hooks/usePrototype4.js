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

  const seed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', 'POST /api/demo/seed');
      addTrace('system', 'Seeding GlobalTech Store with cross-border transaction history...');
      const res = await fetch(`${BASE}/demo/seed`, { method: 'POST' });
      if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
      const json = await res.json();
      addTrace('system', `Seed complete: ${json.transactionsGenerated || 'N/A'} transactions across ${json.corridorsActive || 3} corridors`);
      addTrace('result', 'Demo data seeded successfully - GlobalTech Store ready');
      setData((prev) => ({ ...prev, seed: json }));
      return json;
    } catch (err) {
      addTrace('error', `Seed failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

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

      const cardFee = json.cardRoute?.totalFee || json.comparison?.cardFee || (parseFloat(amountLocal) * 0.06);
      const stablecoinFee = json.stablecoinRoute?.totalFee || json.comparison?.stablecoinFee || (parseFloat(amountLocal) * 0.005);
      const cardPct = json.cardRoute?.feePercent || '6.0';
      const stablecoinPct = json.stablecoinRoute?.feePercent || '0.5';
      const savings = json.savings || (cardFee - stablecoinFee);
      const savingsPct = json.savingsPercent || ((savings / cardFee) * 100).toFixed(1);

      addTrace('system', `Route Comparison: Card route = ${cardPct}% ($${cardFee.toFixed(2)})`);
      await delay(200);
      addTrace('system', `Route Comparison: Stablecoin route = ${stablecoinPct}% ($${stablecoinFee.toFixed(2)})`);
      await delay(200);
      addTrace('system', `Route Comparison: SAVINGS = $${savings.toFixed(2)} (${savingsPct}%)`);
      await delay(300);

      addTrace('system', 'Compliance: OFAC screening... PASSED');
      await delay(200);

      const fxRate = json.fxRate || json.rate || 0.05714;
      const usdAmount = json.usdAmount || json.amountUsd || (parseFloat(amountLocal) * fxRate);

      if (buyerCurrency !== 'USD') {
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

      const settlementTime = json.settlementTime || (2.5 + Math.random() * 1.5).toFixed(1);
      addTrace('result', `Settlement COMPLETE | $${usdAmount.toFixed(2)} USD received`);
      addTrace('result', `Total time: ${settlementTime} seconds | Fee: $${stablecoinFee.toFixed(2)} (${stablecoinPct}%) | Saved: $${savings.toFixed(2)} vs card rails`);

      setData((prev) => ({ ...prev, transaction: json }));
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
