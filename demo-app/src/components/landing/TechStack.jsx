const STACK_ITEMS = [
  {
    title: 'Finxact',
    subtitle: 'Core Banking',
    color: '#003B5C',
  },
  {
    title: 'FIUSD',
    subtitle: 'Stablecoin',
    color: '#FF6600',
  },
  {
    title: 'INDX',
    subtitle: 'Digital Assets',
    color: '#008090',
  },
  {
    title: 'CommerceHub',
    subtitle: 'Payment Processing',
    color: '#003B5C',
  },
  {
    title: 'Clover',
    subtitle: 'POS / Merchant',
    color: '#2E7D32',
  },
]

export default function TechStack() {
  return (
    <section className="tech-stack" aria-label="Technology stack">
      <h2 className="tech-stack__title">Fiserv Technology Stack</h2>
      <div className="tech-stack__diagram">
        {STACK_ITEMS.map((item, index) => (
          <div key={item.title} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && (
              <div className="tech-stack__connector" aria-hidden="true">
                {'\u2192'}
              </div>
            )}
            <div
              className="tech-stack__box"
              style={{ borderColor: item.color }}
            >
              <div className="tech-stack__box-title" style={{ color: item.color }}>
                {item.title}
              </div>
              <div className="tech-stack__box-subtitle">{item.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
