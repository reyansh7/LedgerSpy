import React from 'react'

export default function StatCard({ title, value, icon, color = 'primary' }) {
  const accentMap = {
    primary: 'text-cyan-300 border-cyan-400/30',
    warning: 'text-amber-300 border-amber-400/30',
    success: 'text-emerald-300 border-emerald-400/30',
  }

  return (
    <div className={`rounded-2xl border bg-slate-900/70 p-4 shadow-xl shadow-slate-950/30 ${accentMap[color] || accentMap.primary}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        {icon ? <span className="text-sm opacity-80">{icon}</span> : null}
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
    </div>
  )
}
