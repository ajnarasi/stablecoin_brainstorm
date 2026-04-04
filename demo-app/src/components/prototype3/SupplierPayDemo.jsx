import StatCard from '../shared/StatCard';
import AnimatedCounter from '../shared/AnimatedCounter';

export default function SupplierPayDemo({ proto }) {
  const { seed, evaluateInventory, triggerAutoOrder, getSavings, loading, data, error } = proto;

  const evaluation = data.evaluation;
  const autoOrder = data.autoOrder;
  const savings = data.savings;

  // API returns { inventory: { ingredients: [...] } } from evaluate endpoint
  const ingredients = evaluation?.inventory?.ingredients || [];

  // API returns { purchase_orders: [...] } from auto-order endpoint
  const orders = autoOrder?.purchase_orders || [];

  // Savings: prefer savings endpoint data, fall back to autoOrder data
  const monthlySavings = Number(savings?.total_savings ?? autoOrder?.total_savings) || 0;
  const discountsCaptured = Number(savings?.total_early_pay_discounts) || 0;
  const cardFeesEliminated = Number(savings?.total_card_fee_savings) || 0;
  const avgSettlement = Number(savings?.avg_payment_speed_hours) || 0;

  return (
    <div className="demo-layout">
      {error && (
        <div className="demo-error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="demo-controls">
        <button
          className="btn btn-primary"
          onClick={seed}
          disabled={loading}
        >
          Seed Demo Data
        </button>
        <button
          className="btn btn-outline"
          onClick={evaluateInventory}
          disabled={loading}
        >
          Evaluate Inventory
        </button>
        <button
          className="btn btn-accent btn-lg"
          onClick={triggerAutoOrder}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'AI Auto-Order'}
        </button>
        <button
          className="btn btn-outline"
          onClick={getSavings}
          disabled={loading}
        >
          View Savings Report
        </button>
      </div>

      <div className="grid-4 mt-lg stagger-children">
        <StatCard
          label="Monthly Savings"
          value={<AnimatedCounter value={monthlySavings} prefix="$" decimals={0} />}
          subValue="vs. card payments"
          color="var(--color-green)"
        />
        <StatCard
          label="Early-Pay Discounts Captured"
          value={<AnimatedCounter value={discountsCaptured} prefix="$" decimals={2} />}
          subValue="2% net-24h terms"
          color="var(--color-orange)"
        />
        <StatCard
          label="Card Fees Eliminated"
          value={<AnimatedCounter value={cardFeesEliminated} prefix="$" decimals={2} />}
          subValue="2.9% processing saved"
          color="var(--color-navy)"
        />
        <StatCard
          label="Avg Settlement Time"
          value={avgSettlement ? <AnimatedCounter value={avgSettlement} suffix="h" decimals={1} /> : '--'}
          subValue="vs. 3-5 business days"
          color="var(--color-teal)"
        />
      </div>

      {ingredients.length > 0 && (
        <section className="mt-xl" aria-label="Inventory status">
          <h3 className="section-title">Inventory Status</h3>
          <div className="inventory-grid">
            {ingredients.map((ing, i) => {
              const name = ing.name || `Ingredient ${i + 1}`;
              const status = (ing.status || 'OK').toUpperCase();
              const statusClass =
                status === 'CRITICAL' ? 'inventory-card--critical' :
                status === 'LOW' ? 'inventory-card--low' :
                'inventory-card--ok';
              return (
                <div key={`${ing.ingredient_id || name}-${i}`} className={`inventory-card ${statusClass}`}>
                  <div className="inventory-card__header">
                    <span className="inventory-card__name">{name}</span>
                    <span className={`inventory-card__badge inventory-card__badge--${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                  <div className="inventory-card__details">
                    <div className="inventory-card__row">
                      <span>Current Stock</span>
                      <strong>{ing.current_stock != null ? ing.current_stock : '?'} {ing.unit || ''}</strong>
                    </div>
                    <div className="inventory-card__row">
                      <span>Reorder Point</span>
                      <strong>{ing.reorder_point != null ? ing.reorder_point : '?'} {ing.unit || ''}</strong>
                    </div>
                    <div className="inventory-card__row">
                      <span>Days Until Reorder</span>
                      <strong className={status === 'CRITICAL' ? 'text-red' : status === 'LOW' ? 'text-yellow' : ''}>
                        {ing.days_until_reorder != null ? `${ing.days_until_reorder} days` : '--'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {orders.length > 0 && (
        <section className="mt-xl" aria-label="Purchase orders">
          <h3 className="section-title">Purchase Orders</h3>
          <div className="po-list">
            {orders.map((po, i) => {
              const items = po.line_items || [];
              const supplierName = po.supplier_name || `Supplier ${i + 1}`;
              const total = Number(po.total_amount) || 0;
              const discount = Number(po.discount_amount) || 0;
              const net = Number(po.net_amount) || (total - discount);

              return (
                <div key={po.id || i} className="po-card">
                  <div className="po-card__header">
                    <div>
                      <span className="po-card__number">PO #{po.id || i + 1}</span>
                      <span className="po-card__supplier">{supplierName}</span>
                    </div>
                    <div className="po-card__status">
                      <span className={`po-card__badge po-card__badge--${(po.status || 'pending').toLowerCase()}`}>
                        {po.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                  <div className="po-card__items">
                    {items.map((item, j) => (
                      <div key={j} className="po-card__item">
                        <span>{item.ingredient_name || `Item ${j + 1}`}</span>
                        <span>{item.quantity} units</span>
                        <span>${Number(item.unit_price || 0).toFixed(2)} ea</span>
                        <span>${Number(item.total || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="po-card__footer">
                    <div className="po-card__total">
                      <span>Total: ${total.toFixed(2)}</span>
                      {discount > 0 && (
                        <span className="po-card__discount">-${discount.toFixed(2)} discount</span>
                      )}
                    </div>
                    <div className="po-card__net">
                      Net: <strong>${net.toFixed(2)}</strong> FIUSD
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {savings && (
        <section className="mt-xl" aria-label="Savings breakdown">
          <h3 className="section-title">Savings Breakdown</h3>
          <div className="savings-chart">
            <div className="savings-chart__bar-group">
              <div className="savings-chart__label">Card Fee Savings</div>
              <div className="savings-chart__bar-wrapper">
                <div
                  className="savings-chart__bar savings-chart__bar--navy"
                  style={{ width: `${Math.min((cardFeesEliminated / (cardFeesEliminated + discountsCaptured || 1)) * 100, 100)}%` }}
                >
                  <span>${cardFeesEliminated.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="savings-chart__bar-group">
              <div className="savings-chart__label">Early-Pay Discount Savings</div>
              <div className="savings-chart__bar-wrapper">
                <div
                  className="savings-chart__bar savings-chart__bar--orange"
                  style={{ width: `${Math.min((discountsCaptured / (cardFeesEliminated + discountsCaptured || 1)) * 100, 100)}%` }}
                >
                  <span>${discountsCaptured.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="savings-chart__total">
              Total Monthly Savings: <strong>${monthlySavings.toFixed(2)}</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
