import React from 'react'

export default function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tab-bar__tab ${activeTab === tab.key ? 'tab-bar__tab--active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
