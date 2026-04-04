import { useState } from 'react';
import SectionTabs from '../components/shared/SectionTabs';
import LiveTracePanel from '../components/shared/LiveTracePanel';
import CrossBorderDemo from '../components/prototype4/CrossBorderDemo';
import CrossBorderDocs from '../components/prototype4/CrossBorderDocs';
import CrossBorderDesign from '../components/prototype4/CrossBorderDesign';
import CrossBorderWorkflow from '../components/prototype4/CrossBorderWorkflow';
import { useTraceLog } from '../hooks/useTraceLog';
import { usePrototype4 } from '../hooks/usePrototype4';

const TABS = ['Demo', 'Documentation', 'Design Spec', 'How It Works'];

export default function Prototype4Page() {
  const [activeTab, setActiveTab] = useState('Demo');
  const { entries, addTrace, clearTrace } = useTraceLog();
  const proto4 = usePrototype4(addTrace);

  return (
    <div className="page-layout">
      <div className="page-content">
        <div className="prototype-header">
          <div className="prototype-header__badge">Prototype 4</div>
          <h1 className="prototype-header__title">Cross-Border</h1>
          <p className="prototype-header__subtitle">
            Eliminate cross-border fees with automatic stablecoin routing and real-time settlement
          </p>
        </div>

        <SectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div role="tabpanel" style={{ paddingTop: 24 }}>
          {activeTab === 'Demo' && (
            <div className="demo-split-layout">
              <div className="demo-split-layout__main">
                <CrossBorderDemo proto={proto4} />
              </div>
              <div className="demo-split-layout__trace">
                <LiveTracePanel entries={entries} onClear={clearTrace} />
              </div>
            </div>
          )}
          {activeTab === 'Documentation' && <CrossBorderDocs />}
          {activeTab === 'Design Spec' && <CrossBorderDesign />}
          {activeTab === 'How It Works' && <CrossBorderWorkflow />}
        </div>
      </div>
    </div>
  );
}
