import { useState } from 'react';
import SectionTabs from '../components/shared/SectionTabs';
import LiveTracePanel from '../components/shared/LiveTracePanel';
import SupplierPayDemo from '../components/prototype3/SupplierPayDemo';
import SupplierPayDocs from '../components/prototype3/SupplierPayDocs';
import SupplierPayDesign from '../components/prototype3/SupplierPayDesign';
import SupplierPayWorkflow from '../components/prototype3/SupplierPayWorkflow';
import { useTraceLog } from '../hooks/useTraceLog';
import { usePrototype3 } from '../hooks/usePrototype3';

const TABS = ['Demo', 'Documentation', 'Design Spec', 'How It Works'];

export default function Prototype3Page() {
  const [activeTab, setActiveTab] = useState('Demo');
  const { entries, addTrace, clearTrace } = useTraceLog();
  const proto3 = usePrototype3(addTrace);

  return (
    <div className="page-layout">
      <div className="page-content">
        <div className="prototype-header">
          <div className="prototype-header__badge">Prototype 3</div>
          <h1 className="prototype-header__title">Supplier Pay</h1>
          <p className="prototype-header__subtitle">
            AI-powered procurement with instant FIUSD settlement for restaurant supply chains
          </p>
        </div>

        <SectionTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div role="tabpanel" style={{ paddingTop: 24 }}>
          {activeTab === 'Demo' && (
            <div className="demo-split-layout">
              <div className="demo-split-layout__main">
                <SupplierPayDemo proto={proto3} />
              </div>
              <div className="demo-split-layout__trace">
                <LiveTracePanel entries={entries} onClear={clearTrace} />
              </div>
            </div>
          )}
          {activeTab === 'Documentation' && <SupplierPayDocs />}
          {activeTab === 'Design Spec' && <SupplierPayDesign />}
          {activeTab === 'How It Works' && <SupplierPayWorkflow />}
        </div>
      </div>
    </div>
  );
}
