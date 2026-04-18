import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MdDashboard, MdCloudUpload, MdAssignment, MdLogout } from 'react-icons/md'

export default function Sidebar() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: MdDashboard },
    { path: '/upload', label: 'Upload File', icon: MdCloudUpload },
    { path: '/results', label: 'Results', icon: MdAssignment }
  ]
  
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">LS</div>
        <span className="sidebar__brand-text">LedgerSpy</span>
      </div>
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar__link ${location.pathname === item.path ? 'sidebar__link--active' : ''}`}
          >
            <item.icon className="sidebar__link-icon" />
            <span className="sidebar__link-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar__footer">
        <button className="sidebar__link">
          <MdLogout className="sidebar__link-icon" />
          <span className="sidebar__link-label">Logout</span>
        </button>
      </div>
    </aside>
  )
}
