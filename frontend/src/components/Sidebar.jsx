import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-950/60 p-4 lg:block">
      <nav className="flex flex-col gap-2">
        <Link to="/" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100">Dashboard</Link>
        <Link to="/upload" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100">Upload File</Link>
        <Link to="/results" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100">Results</Link>
      </nav>
    </aside>
  )
}
