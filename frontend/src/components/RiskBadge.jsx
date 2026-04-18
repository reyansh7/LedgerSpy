import React from 'react'

function getRiskStyle(score) {
  if (score >= 80) return 'bg-red-500/20 text-red-300 border-red-400/40'
  if (score >= 60) return 'bg-amber-500/20 text-amber-300 border-amber-400/40'
  return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
}

export default function RiskBadge({ score }) {
  const numericScore = Number(score || 0)
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskStyle(numericScore)}`}
    >
      Risk {numericScore.toFixed(1)}
    </span>
  )
}
