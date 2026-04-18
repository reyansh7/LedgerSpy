import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <Link to="/" className="sidebar-link">Dashboard</Link>
        <Link to="/upload" className="sidebar-link">Upload File</Link>
        <Link to="/results" className="sidebar-link">Results</Link>
      </nav>
    </aside>
  )
}
