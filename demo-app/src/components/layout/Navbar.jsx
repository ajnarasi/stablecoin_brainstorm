import { NavLink } from 'react-router-dom'
import { useApiHealth } from '../../hooks/useApiHealth'
import LiveIndicator from '../shared/LiveIndicator'

const NAV_ITEMS = [
  { path: '/yield-sweep', label: 'Yield Sweep', healthKey: 'p1' },
  { path: '/agent-pay', label: 'Agent Pay', healthKey: 'p2' },
  { path: '/supplier-pay', label: 'Supplier Pay', healthKey: 'p3' },
  { path: '/cross-border', label: 'Cross-Border', healthKey: 'p4' },
]

export default function Navbar() {
  const health = useApiHealth()

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <NavLink to="/" className="navbar__logo" aria-label="Fiserv Digital Pay home">
        Fiserv <span>Digital Pay</span>
      </NavLink>

      <div className="navbar__nav" role="menubar">
        {NAV_ITEMS.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            role="menuitem"
            className={({ isActive }) =>
              `navbar__link${isActive ? ' navbar__link--active' : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className="navbar__health" aria-label="Service health status">
        {NAV_ITEMS.map(({ label, healthKey }) => (
          <div key={healthKey} className="navbar__health-item">
            <LiveIndicator status={health[healthKey]} label={label} />
          </div>
        ))}
      </div>
    </nav>
  )
}
