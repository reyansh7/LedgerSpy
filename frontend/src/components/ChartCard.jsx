import React from 'react'

export default function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/30">
      <header className="mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
      </header>
      <div className="h-64">{children}</div>
    </section>
  )
}
