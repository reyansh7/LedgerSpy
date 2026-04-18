import React from 'react'

function getRiskConfig(score) {
  if (score >= 80) return {
    label: 'Critical',
    bg: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    border: 'rgba(239, 68, 68, 0.35)',
    dotColor: '#ef4444',
    barColor: 'linear-gradient(90deg, #ef4444, #dc2626)',
  }
  if (score >= 60) return {
    label: 'High',
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
    dotColor: '#f59e0b',
    barColor: 'linear-gradient(90deg, #f59e0b, #ea580c)',
  }
  if (score >= 40) return {
    label: 'Medium',
    bg: 'rgba(234, 179, 8, 0.12)',
    color: '#facc15',
    border: 'rgba(234, 179, 8, 0.35)',
    dotColor: '#eab308',
    barColor: 'linear-gradient(90deg, #eab308, #ca8a04)',
  }
  return {
    label: 'Low',
    bg: 'rgba(34, 197, 94, 0.12)',
    color: '#4ade80',
    border: 'rgba(34, 197, 94, 0.35)',
    dotColor: '#22c55e',
    barColor: 'linear-gradient(90deg, #22c55e, #16a34a)',
  }
}

export default function RiskBadge({ score }) {
  const numericScore = Number(score || 0)
  const config = getRiskConfig(numericScore)
  
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {/* Score badge */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: '10px',
          padding: '6px 12px',
          transition: 'all 200ms ease',
        }}
      >
        {/* Pulsing dot */}
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: config.dotColor,
          boxShadow: `0 0 6px ${config.dotColor}`,
          animation: numericScore >= 70 ? 'riskPulse 2s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }} />
        <span style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '0.8rem', fontWeight: 600, color: config.color }}>
          {numericScore.toFixed(1)}
        </span>
      </span>

      {/* Mini progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '50px' }}>
        <div style={{
          width: '50px',
          height: '4px',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(numericScore, 100)}%`,
            height: '100%',
            borderRadius: '4px',
            background: config.barColor,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, color: config.color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {config.label}
        </span>
      </div>

      <style>{`
        @keyframes riskPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
