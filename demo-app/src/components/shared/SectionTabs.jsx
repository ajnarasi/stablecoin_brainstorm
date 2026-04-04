export default function SectionTabs({ tabs = [], activeTab, onTabChange }) {
  return (
    <div className="section-tabs" role="tablist" aria-label="Section navigation">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`tabpanel-${tab}`}
          className={`section-tabs__tab${activeTab === tab ? ' section-tabs__tab--active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
