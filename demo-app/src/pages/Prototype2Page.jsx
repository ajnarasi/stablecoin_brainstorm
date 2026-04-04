import { useState } from 'react'
import SectionTabs from '../components/shared/SectionTabs'
import AgentPayDemo from '../components/prototype2/AgentPayDemo'
import AgentPayDocs from '../components/prototype2/AgentPayDocs'
import AgentPayDesign from '../components/prototype2/AgentPayDesign'
import AgentPayWorkflow from '../components/prototype2/AgentPayWorkflow'
import '../styles/prototype.css'

const TABS = ['Demo', 'Documentation', 'Design Spec', 'How It Works']

export default function Prototype2Page() {
  const [activeTab, setActiveTab] = useState('Demo')

  return (
    <div className="page-layout">
      <div className="page-content">
        <div className="prototype-header">
          <div className="prototype-header__badge prototype-header__badge--p2">Prototype 2</div>
          <h1 className="prototype-header__title">Agent Pay</h1>
          <p className="prototype-header__subtitle">
            x402 protocol enabling AI agents to discover, authenticate, and pay merchants autonomously
          </p>
        </div>

        <SectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div role="tabpanel" style={{ paddingTop: 24 }}>
          {activeTab === 'Demo' && <AgentPayDemo />}
          {activeTab === 'Documentation' && <AgentPayDocs />}
          {activeTab === 'Design Spec' && <AgentPayDesign />}
          {activeTab === 'How It Works' && <AgentPayWorkflow />}
        </div>
      </div>
    </div>
  )
}
