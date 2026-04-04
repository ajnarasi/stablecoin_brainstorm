import { useState } from 'react'
import SectionTabs from '../components/shared/SectionTabs'
import YieldSweepDemo from '../components/prototype1/YieldSweepDemo'
import YieldSweepDocs from '../components/prototype1/YieldSweepDocs'
import YieldSweepDesign from '../components/prototype1/YieldSweepDesign'
import YieldSweepWorkflow from '../components/prototype1/YieldSweepWorkflow'
import '../styles/prototype.css'

const TABS = ['Demo', 'Documentation', 'Design Spec', 'How It Works']

export default function Prototype1Page() {
  const [activeTab, setActiveTab] = useState('Demo')

  return (
    <div className="page-layout">
      <div className="page-content">
        <div className="prototype-header">
          <div className="prototype-header__badge">Prototype 1</div>
          <h1 className="prototype-header__title">Yield Sweep</h1>
          <p className="prototype-header__subtitle">
            AI-powered treasury agent that sweeps idle merchant balances into yield-bearing FIUSD positions
          </p>
        </div>

        <SectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div role="tabpanel" style={{ paddingTop: 24 }}>
          {activeTab === 'Demo' && <YieldSweepDemo />}
          {activeTab === 'Documentation' && <YieldSweepDocs />}
          {activeTab === 'Design Spec' && <YieldSweepDesign />}
          {activeTab === 'How It Works' && <YieldSweepWorkflow />}
        </div>
      </div>
    </div>
  )
}
