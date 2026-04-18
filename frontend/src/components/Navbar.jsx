import React from 'react'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>LedgerSpy</h1>
      </div>
      <div className="navbar-menu">
        <a href="/">Dashboard</a>
        <a href="/upload">Upload</a>
        <a href="/">Logout</a>
      </div>
    </nav>
  )
}
