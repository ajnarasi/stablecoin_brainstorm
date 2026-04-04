export default function Hero() {
  const stats = [
    { value: '$2-4T', label: 'Market Opportunity' },
    { value: '6M', label: 'Fiserv Merchants' },
    { value: '<1%', label: 'Transaction Cost' },
    { value: '3 sec', label: 'Settlement Time' },
  ]

  return (
    <section className="hero" aria-label="Hero">
      <div className="hero__content animate-fade-in">
        <h1 className="hero__title">
          Fiserv <span>Digital Pay</span>
        </h1>
        <p className="hero__subtitle">
          Crypto &amp; Stablecoin Acceptance Strategy
        </p>
        <p className="hero__tagline">
          4 Live Prototypes &nbsp;|&nbsp; Investor Day May 2026
        </p>

        <div className="hero__stats stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className="hero__stat">
              <div className="hero__stat-value">{stat.value}</div>
              <div className="hero__stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
