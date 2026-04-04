import Hero from '../components/landing/Hero'
import PrototypeCards from '../components/landing/PrototypeCards'
import TechStack from '../components/landing/TechStack'

export default function Landing() {
  return (
    <main className="page-layout">
      <div className="page-content page-content--landing">
        <Hero />
        <PrototypeCards />
        <TechStack />
        <div style={{ height: 'var(--footer-height)' }} />
      </div>
    </main>
  )
}
