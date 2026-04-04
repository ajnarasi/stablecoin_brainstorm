export default function StatCard({ value, label, trend, subValue, color = 'navy' }) {
  const trendStr = typeof trend === 'string' ? trend : ''
  const trendDirection = trendStr.startsWith('+') ? 'up' : trendStr.startsWith('-') ? 'down' : null

  return (
    <div className="stat-card">
      <div className={`stat-card__value stat-card__value--${color}`}>
        {value != null ? value : '--'}
      </div>
      <div className="stat-card__label">{label}</div>
      {subValue && (
        <div className="stat-card__sub-value">{subValue}</div>
      )}
      {trendStr && (
        <div className={`stat-card__trend stat-card__trend--${trendDirection}`}>
          {trendDirection === 'up' ? '\u2191' : '\u2193'} {trendStr}
        </div>
      )}
    </div>
  )
}
