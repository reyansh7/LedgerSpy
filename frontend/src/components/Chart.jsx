import React from 'react'

export default function Chart({ data, type = 'bar', title }) {
  return (
    <div className="chart">
      <h3 className="chart-title">{title}</h3>
      <p className="chart-placeholder">
        Chart visualization would be rendered here using Chart.js or Plotly
      </p>
    </div>
  )
}
