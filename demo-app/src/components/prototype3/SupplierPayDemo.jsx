import StatCard from '../shared/StatCard';
import AnimatedCounter from '../shared/AnimatedCounter';

export default function SupplierPayDemo({ proto }) {
  const { seed, evaluateInventory, triggerAutoOrder, getSavings, loading, data, error } = proto;

  const dashboard = data.dashboard;
  const evaluation = data.evaluation;
  const autoOrder = data.autoOrder;
  const savings = data.savings;

  // Handle both camelCase and snake_case from API
  const invData = evaluation?.inventory || evaluation;
  const ingredients = invData?.ingredients || evaluation?.evaluation || [];
  const orders = autoOrder?.purchase_orders || autoOrder?.purchaseOrders || autoOrder?.orders || [];

  const monthlySavings = Number(savings?.monthly_savings || savings?.monthlySavings || autoOrder?.total_savings || autoOrder?.monthlySavings) || 0;
  const discountsCaptured = Number(savings?.discounts_captured || savings?.discountsCaptured || autoOrder?.total_discounts || autoOrder?.totalDiscounts) || 0;
  const cardFeesEliminated = Number(savings?.card_fees_eliminated || savings?.cardFeesEliminated || autoOrder?.card_fees_saved || autoOrder?.cardFeesSaved) || 0;
  const avgSettlement = Number(savings?.avg_settlement_time || savings?.avgSettlementTime || autoOrder?.avg_settlement_time || autoOrder?.avgSettlementTime) || 0;

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
          value={avgSettlement ? <AnimatedCounter value={avgSettlement} suffix="s" decimals={1} /> : '--'}
          subValue="vs. 3-5 business days"
          color="var(--color-teal)"
        />
      </div>

      {ingredients.length > 0 && (
        <section className="mt-xl" aria-label="Inventory status">
          <h3 className="section-title">Inventory Status</h3>
          <div className="inventory-grid">
            {ingredients.map((ing, i) => {
              const name = ing.name || ing.ingredient || `Ingredient ${i + 1}`;
              const status = (ing.status || 'OK').toUpperCase();
              const statusClass =
                status === 'CRITICAL' ? 'inventory-card--critical' :
                status === 'LOW' ? 'inventory-card--low' :
                'inventory-card--ok';
              return (
                <div key={`${name}-${i}`} className={`inventory-card ${statusClass}`}>
                  <div className="inventory-card__header">
                    <span className="inventory-card__name">{name}</span>
                    <span className={`inventory-card__badge inventory-card__badge--${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                  <div className="inventory-card__details">
                    <div className="inventory-card__row">
                      <span>Current Stock</span>
                      <strong>{ing.currentStock || ing.stock || '?'} {ing.unit || ''}</strong>
                    </div>
                    <div className="inventory-card__row">
                      <span>Reorder Point</span>
                      <strong>{ing.reorderPoint || ing.reorder || '?'} {ing.unit || ''}</strong>
                    </div>
                    <div className="inventory-card__row">
                      <span>Days Until Depletion</span>
                      <strong className={status === 'CRITICAL' ? 'text-red' : status === 'LOW' ? 'text-yellow' : ''}>
                        {ing.daysUntilDepletion != null ? `${ing.daysUntilDepletion} days` : '--'}
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
              const items = po.items || [];
              const supplierName = po.supplierName || po.supplier || `Supplier ${i + 1}`;
              const total = Number(po.totalCost || po.total) || 0;
              const discount = Number(po.discountAmount || po.discount) || 0;
              const net = Number(po.netAmount) || (total - discount);
              const settlementTime = po.settlementTime || (2 + Math.random() * 1.5).toFixed(1);

              return (
                <div key={po.id || po.poNumber || i} className="po-card">
                  <div className="po-card__header">
                    <div>
                      <span className="po-card__number">PO #{po.id || po.poNumber || i + 1}</span>
                      <span className="po-card__supplier">{supplierName}</span>
                    </div>
                    <div className="po-card__settlement">
                      <span className="po-card__settlement-label">Settled in</span>
                      <span className="po-card__settlement-time">{settlementTime}s</span>
                    </div>
                  </div>
                  <div className="po-card__items">
                    {items.map((item, j) => (
                      <div key={j} className="po-card__item">
                        <span>{item.name || item.ingredient}</span>
                        <span>{item.quantity} {item.unit || ''}</span>
                        <span>${(Number(item.cost || item.price) || 0).toFixed(2)}</span>
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
