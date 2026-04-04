import { useState } from 'react';
import StatCard from '../shared/StatCard';
import AnimatedCounter from '../shared/AnimatedCounter';

const BUYERS = [
  { id: 'BUYER_MX_001', name: 'Carlos Rodriguez', currency: 'MXN', flag: 'MX', defaultAmount: 17500 },
  { id: 'BUYER_DE_001', name: 'Hans Mueller', currency: 'EUR', flag: 'EU', defaultAmount: 920 },
  { id: 'BUYER_GB_001', name: 'James Wilson', currency: 'GBP', flag: 'GB', defaultAmount: 785 },
  { id: 'BUYER_US_001', name: 'John Smith', currency: 'USD', flag: 'US', defaultAmount: 1000 },
];

export default function CrossBorderDemo({ proto }) {
  const { seed, triggerLiveTransaction, getDashboard, getAnalytics, getFxRates, loading, data, error } = proto;

  const [selectedBuyer, setSelectedBuyer] = useState(BUYERS[0].id);
  const [amount, setAmount] = useState(BUYERS[0].defaultAmount.toString());

  const transaction = data.transaction;
  const dashboard = data.dashboard;
  const analytics = data.analytics;
  const fxRates = data.fxRates;

  const buyer = BUYERS.find((b) => b.id === selectedBuyer);

  const handleBuyerChange = (e) => {
    const id = e.target.value;
    setSelectedBuyer(id);
    const b = BUYERS.find((x) => x.id === id);
    if (b) setAmount(b.defaultAmount.toString());
  };

  const handleProcess = () => {
    triggerLiveTransaction(selectedBuyer, amount);
  };

  // Transaction comparison data from normalized hook output - ensure numeric types for .toFixed() safety
  const cardFeeRaw = transaction?.cardRoute?.totalFee ?? null;
  const cardFee = cardFeeRaw != null ? Number(cardFeeRaw) : null;
  const stablecoinFeeRaw = transaction?.stablecoinRoute?.totalFee ?? null;
  const stablecoinFee = stablecoinFeeRaw != null ? Number(stablecoinFeeRaw) : null;
  const savingsRaw = transaction?.savings ?? (cardFee != null && stablecoinFee != null ? cardFee - stablecoinFee : null);
  const savingsVal = savingsRaw != null ? Number(savingsRaw) : null;
  const usdAmountRaw = transaction?.usdAmount ?? null;
  const usdAmount = usdAmountRaw != null ? Number(usdAmountRaw) : null;
  const settlementTime = transaction?.settlementTime ?? null;
  const fxRateRaw = transaction?.fxRate ?? null;
  const fxRate = fxRateRaw != null ? Number(fxRateRaw) : null;

  // Dashboard stats from headline_stats (populated after seed auto-fetches dashboard)
  const hs = dashboard?.headline_stats || {};
  const totalSavings = Number(hs.total_savings_usd) || 0;
  const crossBorderTxns = Number(hs.cross_border_transactions) || 0;
  const avgSettlement = Number(hs.avg_settlement_seconds) || 0;
  const corridorsActive = Number(hs.corridors_active) || 0;

  // FX rate display
  const rates = fxRates?.rates || fxRates || {};

  return (
    <div className="demo-layout">
      {error && (
        <div className="demo-error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="demo-controls">
        <button className="btn btn-primary" onClick={seed} disabled={loading}>
          Seed Demo Data
        </button>
        <div className="demo-controls__separator" aria-hidden="true" />
        <div className="demo-controls__group">
          <label htmlFor="buyer-select" className="demo-controls__label">Buyer</label>
          <select
            id="buyer-select"
            className="demo-select"
            value={selectedBuyer}
            onChange={handleBuyerChange}
          >
            {BUYERS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.currency})
              </option>
            ))}
          </select>
        </div>
        <div className="demo-controls__group">
          <label htmlFor="amount-input" className="demo-controls__label">
            Amount ({buyer?.currency || 'USD'})
          </label>
          <input
            id="amount-input"
            type="number"
            className="demo-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
          />
        </div>
        <button
          className="btn btn-accent btn-lg"
          onClick={handleProcess}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Process Payment'}
        </button>
        <button className="btn btn-outline" onClick={() => { getAnalytics(); getFxRates(); }} disabled={loading}>
          View Corridor Analytics
        </button>
      </div>

      <div className="grid-4 mt-lg stagger-children">
        <StatCard
          label="Total Savings"
          value={<AnimatedCounter value={totalSavings} prefix="$" decimals={2} />}
          subValue="vs. traditional card rails"
          color="var(--color-green)"
        />
        <StatCard
          label="Cross-Border Transactions"
          value={<AnimatedCounter value={crossBorderTxns} decimals={0} />}
          subValue="processed via FIUSD"
          color="var(--color-navy)"
        />
        <StatCard
          label="Avg Settlement Time"
          value={avgSettlement ? <AnimatedCounter value={avgSettlement} suffix="s" decimals={0} /> : '--'}
          subValue="vs. 3 business days"
          color="var(--color-teal)"
        />
        <StatCard
          label="Corridors Active"
          value={corridorsActive || '--'}
          subValue="MXN, EUR, GBP"
          color="var(--color-orange)"
        />
      </div>

      {/* THE MONEY SHOT: Side-by-Side Comparison */}
      {transaction && (
        <section className="mt-xl" aria-label="Route comparison">
          <h3 className="section-title">Route Comparison</h3>
          <div className="route-comparison">
            <div className="route-comparison__panel route-comparison__panel--card">
              <div className="route-comparison__header route-comparison__header--card">
                Traditional Card Rails
              </div>
              <div className="route-comparison__body">
                <div className="route-comparison__row">
                  <span className="route-comparison__label">Processing Fee</span>
                  <span className="route-comparison__value route-comparison__value--bad">
                    ${cardFee != null ? cardFee.toFixed(2) : '--'}
                  </span>
                </div>
                <div className="route-comparison__detail">
                  {transaction?.cardRoute?.feePercent || '--'}% + FX markup
                </div>
                <div className="route-comparison__row">
                  <span className="route-comparison__label">FX Markup</span>
                  <span className="route-comparison__value route-comparison__value--bad">2.5%</span>
                </div>
                <div className="route-comparison__row">
                  <span className="route-comparison__label">Settlement</span>
                  <span className="route-comparison__value route-comparison__value--bad">3 business days</span>
                </div>
                <div className="route-comparison__row">
                  <span className="route-comparison__label">Intermediaries</span>
                  <span className="route-comparison__value route-comparison__value--bad">4</span>
                </div>
                <div className="route-comparison__detail">
                  Issuer / Network / Acquirer / FX Provider
                </div>
              </div>
            </div>

            <div className="route-comparison__savings" aria-label="Savings amount">
              <div className="route-comparison__savings-amount">
                ${savingsVal != null ? savingsVal.toFixed(2) : '--'}
              </div>
              <div className="route-comparison__savings-label">SAVED</div>
              {savingsVal != null && cardFee != null && cardFee > 0 && (
                <div className="route-comparison__savings-pct">
                  {((savingsVal / cardFee) * 100).toFixed(1)}% reduction
                </div>
              )}
            </div>

            <div className="route-comparison__panel route-comparison__panel--fiusd">
              <div className="route-comparison__header route-comparison__header--fiusd">
                Fiserv FIUSD Rails
              </div>
              <div className="route-comparison__body">
                <div className="route-comparison__row">
                  <span className="route-comparison__label">Processing Fee</span>
                  <span className="route-comparison__value route-comparison__value--good">
                    ${stablecoinFee != null ? stablecoinFee.toFixed(2) : '--'}
                  </span>
                </div>
                <div className="route-comparison__detail">
                  {transaction?.stablecoinRoute?.feePercent || '--'}% all-in
                </div>
                <div className="route-comparison__row">
                  <span className="route-comparison__label">FX Rate</span>
                  <span className="route-comparison__value route-comparison__value--good">Real-time</span>
                </div>
                <div className="route-comparison__row">
                  <span className="route-comparison__label">Settlement</span>
                  <span className="route-comparison__value route-comparison__value--good">
                    {settlementTime != null ? `${settlementTime} seconds` : '--'}
                  </span>
                </div>
                <div className="route-comparison__row">
                  <span className="route-comparison__label">Intermediaries</span>
                  <span className="route-comparison__value route-comparison__value--good">0</span>
                </div>
                <div className="route-comparison__detail">
                  Direct peer-to-peer settlement
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FX Rates Panel */}
      {(Object.keys(rates).length > 0 || fxRate) && (
        <section className="mt-xl" aria-label="FX rates">
          <h3 className="section-title">Live FX Rates</h3>
          <div className="fx-rates-grid">
            {rates.MXN_USD && (
              <div className="fx-rate-card">
                <div className="fx-rate-card__pair">MXN / USD</div>
                <div className="fx-rate-card__rate">{Number(rates.MXN_USD).toFixed(5)}</div>
                <div className="fx-rate-card__label">Mexican Peso</div>
              </div>
            )}
            {rates.EUR_USD && (
              <div className="fx-rate-card">
                <div className="fx-rate-card__pair">EUR / USD</div>
                <div className="fx-rate-card__rate">{Number(rates.EUR_USD).toFixed(5)}</div>
                <div className="fx-rate-card__label">Euro</div>
              </div>
            )}
            {rates.GBP_USD && (
              <div className="fx-rate-card">
                <div className="fx-rate-card__pair">GBP / USD</div>
                <div className="fx-rate-card__rate">{Number(rates.GBP_USD).toFixed(5)}</div>
                <div className="fx-rate-card__label">British Pound</div>
              </div>
            )}
            {fxRate && !rates.MXN_USD && (
              <div className="fx-rate-card">
                <div className="fx-rate-card__pair">{buyer?.currency || '???'} / USD</div>
                <div className="fx-rate-card__rate">{fxRate.toFixed(5)}</div>
                <div className="fx-rate-card__label">Current transaction rate</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Settlement Timer */}
      {transaction && settlementTime != null && (
        <section className="mt-xl" aria-label="Settlement timeline">
          <h3 className="section-title">Settlement Timeline</h3>
          <div className="settlement-timeline">
            <div className="settlement-timeline__step settlement-timeline__step--done">
              <div className="settlement-timeline__dot" />
              <div className="settlement-timeline__content">
                <div className="settlement-timeline__label">FX Conversion</div>
                <div className="settlement-timeline__time">0.0s</div>
              </div>
            </div>
            <div className="settlement-timeline__connector settlement-timeline__connector--done" />
            <div className="settlement-timeline__step settlement-timeline__step--done">
              <div className="settlement-timeline__dot" />
              <div className="settlement-timeline__content">
                <div className="settlement-timeline__label">FIUSD Transfer</div>
                <div className="settlement-timeline__time">0.4s</div>
              </div>
            </div>
            <div className="settlement-timeline__connector settlement-timeline__connector--done" />
            <div className="settlement-timeline__step settlement-timeline__step--done">
              <div className="settlement-timeline__dot" />
              <div className="settlement-timeline__content">
                <div className="settlement-timeline__label">INDX Settlement</div>
                <div className="settlement-timeline__time">{settlementTime}s</div>
              </div>
            </div>
            <div className="settlement-timeline__connector settlement-timeline__connector--done" />
            <div className="settlement-timeline__step settlement-timeline__step--done">
              <div className="settlement-timeline__dot settlement-timeline__dot--final" />
              <div className="settlement-timeline__content">
                <div className="settlement-timeline__label">USD Received</div>
                <div className="settlement-timeline__time settlement-timeline__time--highlight">
                  ${usdAmount != null ? usdAmount.toFixed(2) : '--'} in {settlementTime}s
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Corridor Analytics */}
      {analytics?.corridors && (
        <section className="mt-xl" aria-label="Corridor analytics">
          <h3 className="section-title">Savings by Corridor</h3>
          <div className="corridor-chart">
            {(analytics.corridors || []).map((corridor, idx) => {
              const maxSavings = Math.max(...(analytics.corridors || []).map((c) => Number(c.totalSavings) || 0), 1);
              const pct = ((Number(corridor.totalSavings) || 0) / maxSavings) * 100;
              return (
                <div key={`${corridor.corridor || corridor.name || idx}`} className="corridor-chart__bar-group">
                  <div className="corridor-chart__label">{corridor.corridor || corridor.name}</div>
                  <div className="corridor-chart__bar-wrapper">
                    <div
                      className="corridor-chart__bar"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    >
                      <span>${(Number(corridor.totalSavings) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="corridor-chart__count">{corridor.transactions || 0} txns</div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
