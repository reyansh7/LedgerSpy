import React from 'react'

function getRiskStyle(score) {
  if (score >= 80) return 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25 hover:border-red-400/60'
  if (score >= 60) return 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 hover:border-amber-400/60'
  if (score >= 40) return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25 hover:border-yellow-400/60'
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 hover:border-emerald-400/60'
}

function getRiskLabel(score) {
  if (score >= 80) return 'Critical'
  if (score >= 60) return 'High'
  if (score >= 40) return 'Medium'
  return 'Low'
}

export default function RiskBadge({ score }) {
  const numericScore = Number(score || 0)
  const label = getRiskLabel(numericScore)
  
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${getRiskStyle(numericScore)}`}
      >
        <span className="font-mono">{numericScore.toFixed(1)}</span>
        <span className="ml-1.5 text-xs font-medium opacity-75">{label}</span>
      </span>
    </div>
  )
}
