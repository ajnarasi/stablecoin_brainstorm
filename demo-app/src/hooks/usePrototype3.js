import { useState, useCallback } from 'react';
import { API } from '../config';

const BASE = API.p3;
const MERCHANT = 'MERCH_001';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function usePrototype3(addTrace) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    dashboard: null,
    evaluation: null,
    autoOrder: null,
    savings: null,
    suppliers: null,
  });
  const [error, setError] = useState(null);

  const seed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', 'POST /api/demo/seed');
      addTrace('system', 'Seeding Mario\'s Pizzeria with 30 days of sales data...');
      const res = await fetch(`${BASE}/demo/seed`, { method: 'POST' });
      if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
      const json = await res.json();
      addTrace('system', `Seed complete: ${json.salesGenerated || 'N/A'} sales records, ${json.ingredientsTracked || 'N/A'} ingredients tracked`);
      addTrace('result', 'Demo data seeded successfully - Mario\'s Pizzeria ready');
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

  const evaluateInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', `POST /api/merchants/${MERCHANT}/evaluate`);
      addTrace('system', 'Clover POS: Ingesting 30 days of sales data...');
      const res = await fetch(`${BASE}/merchants/${MERCHANT}/evaluate`, { method: 'POST' });
      if (!res.ok) throw new Error(`Evaluate failed: ${res.status}`);
      const json = await res.json();
      addTrace('system', 'ML Model: Analyzing ingredient depletion patterns...');
      await delay(300);

      const ingredients = json.ingredients || json.evaluation || [];
      const critical = ingredients.filter((i) => i.status === 'CRITICAL' || i.status === 'critical');
      const low = ingredients.filter((i) => i.status === 'LOW' || i.status === 'low');
      const ok = ingredients.filter((i) => i.status === 'OK' || i.status === 'ok');

      critical.forEach((ing) => {
        addTrace('system', `ML Model: ${ing.name || ing.ingredient} depleting in ${ing.daysUntilDepletion || '?'} days (CRITICAL)`);
      });
      low.forEach((ing) => {
        addTrace('system', `ML Model: ${ing.name || ing.ingredient} depleting in ${ing.daysUntilDepletion || '?'} days (LOW)`);
      });
      ok.forEach((ing) => {
        addTrace('system', `ML Model: ${ing.name || ing.ingredient} depleting in ${ing.daysUntilDepletion || '?'} days (OK - monitoring)`);
      });

      addTrace('result', `Evaluation complete: ${critical.length} critical, ${low.length} low, ${ok.length} OK`);
      setData((prev) => ({ ...prev, evaluation: json }));
      return json;
    } catch (err) {
      addTrace('error', `Evaluate failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  const triggerAutoOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', `POST /api/merchants/${MERCHANT}/auto-order`);
      addTrace('system', 'Clover POS: Ingesting 30 days of sales data...');
      await delay(400);
      addTrace('system', 'ML Model: Analyzing ingredient depletion patterns...');
      await delay(400);

      const res = await fetch(`${BASE}/merchants/${MERCHANT}/auto-order`, { method: 'POST' });
      if (!res.ok) throw new Error(`Auto-order failed: ${res.status}`);
      const json = await res.json();

      const predictions = json.predictions || [];
      for (const p of predictions) {
        const status = p.status || 'OK';
        addTrace('system', `ML Model: ${p.ingredient || p.name} depleting in ${p.daysUntilDepletion || '?'} days (${status})`);
        await delay(200);
      }

      addTrace('system', 'Procurement Agent: Generating purchase orders...');
      await delay(300);

      const orders = json.purchaseOrders || json.orders || [];
      for (const po of orders) {
        const items = (po.items || []).map((it) => `${it.name || it.ingredient} ${it.quantity || ''}`).join(' + ');
        addTrace('system', `PO #${po.id || po.poNumber}: ${po.supplierName || po.supplier} - ${items} = $${(po.totalCost || po.total || 0).toFixed(2)}`);
        await delay(200);
      }

      if (json.discounts || orders.some((po) => po.discount)) {
        addTrace('system', 'Procurement Agent: Applying early-pay discount (2% for payment within 24h)...');
        await delay(200);
        for (const po of orders) {
          if (po.discount || po.discountAmount) {
            addTrace('system', `Discount captured: $${(po.discountAmount || po.discount || 0).toFixed(2)} on PO #${po.id || po.poNumber}`);
          }
        }
      }

      for (const po of orders) {
        await delay(300);
        addTrace('api', `Finxact: Executing FIUSD transfer - Merchant -> ${po.supplierName || po.supplier}`);
        addTrace('system', `Finxact: Debit ${MERCHANT}: $${(po.netAmount || po.totalCost || po.total || 0).toFixed(2)} FIUSD`);
        addTrace('system', `Finxact: Credit ${po.supplierId || 'SUP'}: $${(po.netAmount || po.totalCost || po.total || 0).toFixed(2)} FIUSD`);
        await delay(200);
        addTrace('system', `INDX: Settling ${po.supplierName || po.supplier} in USD...`);
        await delay(400);
        const settlementTime = (po.settlementTime || (2 + Math.random() * 1.5)).toFixed(1);
        addTrace('result', `Settlement complete: ${po.supplierName || po.supplier} received $${(po.netAmount || po.totalCost || po.total || 0).toFixed(2)} USD in ${settlementTime} seconds`);
      }

      const totalPaid = orders.reduce((sum, po) => sum + (po.netAmount || po.totalCost || po.total || 0), 0);
      const totalDiscount = orders.reduce((sum, po) => sum + (po.discountAmount || po.discount || 0), 0);
      const cardFeesSaved = json.cardFeesSaved || (totalPaid * 0.029).toFixed(2);

      addTrace('result', `Total: ${orders.length} POs, $${totalPaid.toFixed(2)} paid, $${totalDiscount.toFixed(2)} saved in discounts, $${cardFeesSaved} card fees eliminated`);

      setData((prev) => ({ ...prev, autoOrder: json }));
      return json;
    } catch (err) {
      addTrace('error', `Auto-order failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  const getSavings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', `GET /api/merchants/${MERCHANT}/savings`);
      const res = await fetch(`${BASE}/merchants/${MERCHANT}/savings`);
      if (!res.ok) throw new Error(`Savings failed: ${res.status}`);
      const json = await res.json();
      addTrace('result', `Savings report loaded: $${(json.totalSavings || json.monthlySavings || 0).toFixed(2)} total savings`);
      setData((prev) => ({ ...prev, savings: json }));
      return json;
    } catch (err) {
      addTrace('error', `Savings failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  const getSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      addTrace('api', `GET /api/merchants/${MERCHANT}/suppliers`);
      const res = await fetch(`${BASE}/merchants/${MERCHANT}/suppliers`);
      if (!res.ok) throw new Error(`Suppliers failed: ${res.status}`);
      const json = await res.json();
      addTrace('result', `Loaded ${(json.suppliers || json).length} suppliers`);
      setData((prev) => ({ ...prev, suppliers: json }));
      return json;
    } catch (err) {
      addTrace('error', `Suppliers failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [addTrace]);

  return { seed, getDashboard, evaluateInventory, triggerAutoOrder, getSavings, getSuppliers, loading, data, error };
}
