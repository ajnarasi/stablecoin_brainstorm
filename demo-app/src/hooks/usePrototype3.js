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
      addTrace('system', `Seed complete: status = ${json.status}`);
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

      // API returns { inventory: { ingredients: [...] }, predictions: {...} }
      const ingredients = json.inventory?.ingredients || [];
      const critical = ingredients.filter((i) => i.status === 'CRITICAL');
      const low = ingredients.filter((i) => i.status === 'LOW');
      const ok = ingredients.filter((i) => i.status === 'OK');

      critical.forEach((ing) => {
        addTrace('system', `ML Model: ${ing.name} depleting in ${ing.days_until_reorder != null ? ing.days_until_reorder : '?'} days (CRITICAL)`);
      });
      low.forEach((ing) => {
        addTrace('system', `ML Model: ${ing.name} depleting in ${ing.days_until_reorder != null ? ing.days_until_reorder : '?'} days (LOW)`);
      });
      ok.forEach((ing) => {
        addTrace('system', `ML Model: ${ing.name} depleting in ${ing.days_until_reorder != null ? ing.days_until_reorder : '?'} days (OK - monitoring)`);
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

      addTrace('system', 'Procurement Agent: Generating purchase orders...');
      await delay(300);

      // API returns { purchase_orders: [...], payments: [...], total_savings, message }
      const orders = json.purchase_orders || [];
      for (const po of orders) {
        const lineItems = po.line_items || [];
        const items = lineItems.map((it) => `${it.ingredient_name || ''} x${it.quantity || ''}`).join(' + ');
        const total = Number(po.total_amount) || 0;
        addTrace('system', `PO #${po.id}: ${po.supplier_name} - ${items} = $${total.toFixed(2)}`);
        await delay(200);
      }

      if (json.total_savings > 0 || orders.some((po) => po.discount_amount)) {
        addTrace('system', 'Procurement Agent: Applying early-pay discount (2% for payment within 24h)...');
        await delay(200);
        for (const po of orders) {
          const disc = Number(po.discount_amount) || 0;
          if (disc > 0) {
            addTrace('system', `Discount captured: $${disc.toFixed(2)} on PO #${po.id}`);
          }
        }
      }

      for (const po of orders) {
        await delay(300);
        const amount = Number(po.net_amount) || Number(po.total_amount) || 0;
        addTrace('api', `Finxact: Executing FIUSD transfer - Merchant -> ${po.supplier_name}`);
        addTrace('system', `Finxact: Debit ${MERCHANT}: $${amount.toFixed(2)} FIUSD`);
        addTrace('system', `Finxact: Credit ${po.supplier_id || 'SUP'}: $${amount.toFixed(2)} FIUSD`);
        await delay(200);
        addTrace('system', `INDX: Settling ${po.supplier_name} in USD...`);
        await delay(400);
        const settlementTime = (2 + Math.random() * 1.5).toFixed(1);
        addTrace('result', `Settlement complete: ${po.supplier_name} received $${amount.toFixed(2)} USD in ${settlementTime} seconds`);
      }

      const totalPaid = orders.reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0);
      const totalDiscount = orders.reduce((sum, po) => sum + (Number(po.discount_amount) || 0), 0);
      const totalSavings = Number(json.total_savings) || 0;

      addTrace('result', `Total: ${orders.length} POs, $${totalPaid.toFixed(2)} paid, $${totalDiscount.toFixed(2)} saved in discounts, $${totalSavings.toFixed(2)} total savings`);

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
      addTrace('result', `Savings report loaded: $${Number(json.total_savings || 0).toFixed(2)} total savings`);
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
