import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  MdDashboard,
  MdCloudUpload,
  MdInsights,
  MdPsychology,
  MdAssessment,
  MdHistory,
  MdSettings
} from 'react-icons/md'

const navItems = [
  { path: '/', label: 'Dashboard', icon: MdDashboard },
  { path: '/upload', label: 'Upload', icon: MdCloudUpload },
  { path: '/results', label: 'Results', icon: MdInsights },
  { path: '/explain', label: 'Explain AI', icon: MdPsychology },
  { path: '/reports', label: 'Reports', icon: MdAssessment },
  { path: '/history', label: 'History', icon: MdHistory },
  { path: '/settings', label: 'Settings', icon: MdSettings },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">LS</div>
        <span className="sidebar__brand-text">LedgerSpy</span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <span className="sidebar__link-icon"><Icon /></span>
              <span className="sidebar__link-label">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
