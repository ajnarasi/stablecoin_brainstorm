import { useState, useEffect } from 'react'
import { useTraceLog } from '../../hooks/useTraceLog'
import { usePrototype1 } from '../../hooks/usePrototype1'
import useApiHealth from '../../hooks/useApiHealth'
import LiveTracePanel from '../shared/LiveTracePanel'
import StatCard from '../shared/StatCard'
import DataTable from '../shared/DataTable'
import LiveIndicator from '../shared/LiveIndicator'
import AnimatedCounter from '../shared/AnimatedCounter'

const RISK_OPTIONS = [
  { value: 'conservative', label: 'Conservative', desc: 'Max 10% of excess' },
  { value: 'moderate', label: 'Moderate', desc: 'Max 25% of excess' },
  { value: 'aggressive', label: 'Aggressive', desc: 'Max 50% of excess' },
]

export default function YieldSweepDemo() {
  const { entries, addTrace, clearTrace } = useTraceLog()
  const { seed, getDashboard, triggerSweep, emergencyUnsweep, loading, error } = usePrototype1(addTrace)
  const health = useApiHealth()

  const [riskTolerance, setRiskTolerance] = useState('moderate')
  const [dashboard, setDashboard] = useState(null)
  const [sweepDecision, setSweepDecision] = useState(null)
  const [sweepHistory, setSweepHistory] = useState([])
  const [earningsData, setEarningsData] = useState([])
  const [seeded, setSeeded] = useState(false)

  // Build earnings chart from real accrual_history data
  useEffect(() => {
    if (dashboard && dashboard.accrualHistory && dashboard.accrualHistory.length > 0) {
      // Use real accrual_history from the API
      const history = dashboard.accrualHistory.slice(-30) // last 30 entries
      const days = history.map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: parseFloat(entry.accrued) || 0,
      }))
      setEarningsData(days)
    } else if (dashboard) {
      // Fallback: generate from dailyEarningsRate if no history
      const days = []
      const baseEarning = dashboard.dailyEarningsRate || 0
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: baseEarning * (0.8 + Math.random() * 0.4),
        })
      }
      setEarningsData(days)
    }
  }, [dashboard])

  const handleSeed = async () => {
    const result = await seed()
    if (result) {
      setSeeded(true)
      const dash = await getDashboard()
      if (dash) setDashboard(dash)
    }
  }

  const handleSweep = async () => {
    const result = await triggerSweep()
    if (result) {
      setSweepDecision({
        approved: result.decision === 'APPROVED',
        amount: result.proposedAmount,
        reason: result.reason || 'ML-predicted safe excess',
        timestamp: new Date().toISOString(),
      })
      setSweepHistory((prev) => [[
        new Date().toLocaleString(),
        'SWEEP',
        `$${(result.proposedAmount != null ? Number(result.proposedAmount).toFixed(2) : '--')}`,
        result.decision === 'APPROVED' ? 'COMPLETED' : 'DENIED',
        result.reason || 'ML-predicted safe excess',
      ], ...prev])
      const dash = await getDashboard()
      if (dash) setDashboard(dash)
    }
  }

  const handleUnsweep = async () => {
    const result = await emergencyUnsweep()
    if (result) {
      setSweepHistory((prev) => [[
        new Date().toLocaleString(),
        'UNSWEEP',
        `$${(result.amount != null ? Number(result.amount).toFixed(2) : '0.00')}`,
        'COMPLETED',
        'Emergency liquidity return',
      ], ...prev])
      const dash = await getDashboard()
      if (dash) setDashboard(dash)
    }
  }

  const maxEarning = earningsData.length > 0 ? Math.max(...earningsData.map(d => d.amount)) : 1

  return (
    <div className="demo-split">
      <div className="demo-split__main">
        {/* API Status */}
        <div className="demo-status-bar">
          <LiveIndicator
            status={health.p1}
            label={health.p1 === 'online' ? 'Backend Connected (port 8001)' : 'Backend Offline (port 8001)'}
          />
          {error && <span className="demo-error" role="alert">{error}</span>}
        </div>

        {/* Demo Controls */}
        <div className="demo-controls">
          <h3 className="demo-controls__title">Yield Sweep Controls</h3>
          <div className="demo-controls__buttons">
            <button
              className="btn btn--primary"
              onClick={handleSeed}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Processing...' : 'Seed Demo Data'}
            </button>
            <button
              className="btn btn--accent"
              onClick={handleSweep}
              disabled={loading || !seeded}
              aria-busy={loading}
            >
              {loading ? 'Evaluating...' : 'Trigger Sweep Evaluation'}
            </button>
            <button
              className="btn btn--danger"
              onClick={handleUnsweep}
              disabled={loading || !seeded}
              aria-busy={loading}
            >
              Emergency Unsweep
            </button>
          </div>

          {/* Risk Tolerance */}
          <fieldset className="demo-controls__fieldset">
            <legend className="demo-controls__legend">Risk Tolerance</legend>
            <div className="demo-controls__radio-group">
              {RISK_OPTIONS.map((opt) => (
                <label key={opt.value} className={`radio-card ${riskTolerance === opt.value ? 'radio-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="risk"
                    value={opt.value}
                    checked={riskTolerance === opt.value}
                    onChange={(e) => setRiskTolerance(e.target.value)}
                  />
                  <span className="radio-card__label">{opt.label}</span>
                  <span className="radio-card__desc">{opt.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Stat Cards */}
        <div className="stat-cards-grid">
          <StatCard
            label="Available Balance"
            value={<AnimatedCounter value={dashboard?.currentBalance || 0} prefix="$" decimals={2} />}
            color="navy"
          />
          <StatCard
            label="FIUSD Yield Position"
            value={<AnimatedCounter value={dashboard?.fiusdPosition || 0} prefix="$" decimals={2} />}
            color="teal"
          />
          <StatCard
            label="Monthly Earnings"
            value={<AnimatedCounter value={dashboard?.monthlyEarnings || 0} prefix="$" decimals={2} />}
            color="green"
            trend={dashboard ? '+$' + (dashboard.monthlyEarnings != null ? Number(dashboard.monthlyEarnings).toFixed(2) : '0.00') + '/mo' : undefined}
          />
          <StatCard
            label="APY Rate"
            value={<AnimatedCounter value={dashboard?.apy || 0} suffix="%" decimals={1} />}
            color="orange"
          />
        </div>

        {/* Sweep Decision */}
        {sweepDecision && (
          <div className={`decision-panel decision-panel--${sweepDecision.approved ? 'approved' : 'denied'}`} role="status">
            <div className="decision-panel__header">
              <span className={`decision-panel__badge decision-panel__badge--${sweepDecision.approved ? 'approved' : 'denied'}`}>
                {sweepDecision.approved ? 'APPROVED' : 'DENIED'}
              </span>
              <span className="decision-panel__time">
                {new Date(sweepDecision.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="decision-panel__body">
              <div className="decision-panel__amount">
                ${sweepDecision.amount != null ? Number(sweepDecision.amount).toFixed(2) : '--'}
              </div>
              <div className="decision-panel__reason">{sweepDecision.reason}</div>
            </div>
          </div>
        )}

        {/* Earnings Chart */}
        {earningsData.length > 0 && (
          <div className="earnings-chart">
            <h4 className="earnings-chart__title">Daily Yield Accrual (Last 30 Days)</h4>
            <div className="earnings-chart__bars" role="img" aria-label="Bar chart showing daily yield earnings over last 30 days">
              {earningsData.map((d, i) => (
                <div key={i} className="earnings-chart__bar-col" title={`${d.date}: $${d.amount.toFixed(2)}`}>
                  <div
                    className="earnings-chart__bar"
                    style={{ height: `${(d.amount / maxEarning) * 100}%` }}
                    aria-label={`${d.date}: $${d.amount.toFixed(2)}`}
                  />
                  {i % 5 === 0 && (
                    <span className="earnings-chart__label">{d.date}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sweep History */}
        <div className="demo-section">
          <h4 className="demo-section__title">Sweep History</h4>
          <DataTable
            headers={['Time', 'Type', 'Amount', 'Status', 'Reason']}
            rows={sweepHistory}
          />
        </div>
      </div>

      <div className="demo-split__trace">
        <LiveTracePanel entries={entries} onClear={clearTrace} />
      </div>
    </div>
  )
}
