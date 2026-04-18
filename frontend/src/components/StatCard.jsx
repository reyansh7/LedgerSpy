import React from 'react'

export default function StatCard({ title, value, icon, color = 'primary' }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      {icon && <span className="stat-icon">{icon}</span>}
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  )
}
