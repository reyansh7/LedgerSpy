import React from 'react'

export default function ProgressBar({ value = 0, color = 'var(--accent-purple)', showValue = true, height = 8 }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__track" style={{ height }}>
        <div
          className="progress-bar__fill"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: color
          }}
        />
      </div>
      {showValue && (
        <span className="progress-bar__value">{value}%</span>
      )}
    </div>
  )
}
