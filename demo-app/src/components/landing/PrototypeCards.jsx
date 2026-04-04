import { Link } from 'react-router-dom'
import { useApiHealth } from '../../hooks/useApiHealth'
import LiveIndicator from '../shared/LiveIndicator'

const PROTOTYPES = [
  {
    number: 'Prototype 1',
    title: 'Merchant Yield Sweep',
    description: 'Automatically sweep idle merchant cash into FIUSD stablecoin yield vaults. Earn interest on funds sitting dormant between settlement cycles.',
    metric: '$847/month earned',
    metricLabel: 'on idle cash',
    path: '/yield-sweep',
    healthKey: 'p1',
    icon: '\uD83D\uDCB0',
  },
  {
    number: 'Prototype 2',
    title: 'Pay-by-Agent x402',
    description: 'AI agents autonomously purchase goods and services using HTTP 402 micropayment protocol with stablecoin settlement on Solana.',
    metric: '3 seconds',
    metricLabel: 'agent-to-pay',
    path: '/agent-pay',
    healthKey: 'p2',
    icon: '\uD83E\uDD16',
  },
  {
    number: 'Prototype 3',
    title: 'Instant Supplier Pay',
    description: 'Replace 30-day net terms with instant stablecoin supplier payments. Capture early payment discounts and strengthen supply chains.',
    metric: '$1,200/month saved',
    metricLabel: 'per merchant',
    path: '/supplier-pay',
    healthKey: 'p3',
    icon: '\u26A1',
  },
  {
    number: 'Prototype 4',
    title: 'Cross-Border Settlement',
    description: 'Settle international transactions via stablecoin corridors, bypassing SWIFT intermediaries and reducing FX spreads dramatically.',
    metric: '90% cost reduction',
    metricLabel: 'vs traditional rails',
    path: '/cross-border',
    healthKey: 'p4',
    icon: '\uD83C\uDF0D',
  },
]

export default function PrototypeCards() {
  const health = useApiHealth()

  return (
    <section className="prototype-cards" aria-label="Prototype demos">
      <h2 className="prototype-cards__title">Live Prototypes</h2>
      <div className="prototype-cards__grid stagger-children">
        {PROTOTYPES.map((proto) => (
          <Link
            key={proto.path}
            to={proto.path}
            className="prototype-card card--clickable"
            style={{ textDecoration: 'none' }}
          >
            <div className="prototype-card__icon" aria-hidden="true">
              {proto.icon}
            </div>
            <div className="prototype-card__number">{proto.number}</div>
            <h3 className="prototype-card__title">{proto.title}</h3>
            <p className="prototype-card__description">{proto.description}</p>
            <div className="prototype-card__metric">
              {proto.metric}
            </div>
            <div className="prototype-card__footer">
              <LiveIndicator status={health[proto.healthKey]} label="" />
              <span className="btn btn-primary btn-sm">
                Launch Demo
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
