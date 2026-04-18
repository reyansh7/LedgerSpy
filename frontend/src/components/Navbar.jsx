import React from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="navbar-brand">
          <h1 className="text-lg font-bold tracking-wide text-slate-100">LedgerSpy</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <Link to="/">Dashboard</Link>
          <Link to="/upload">Upload</Link>
          <Link to="/results">Results</Link>
        </div>
      </div>
    </nav>
  )
}
