import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function BarChart({
  labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  values = [65, 45, 75, 55, 80],
  color = '#BB5CF6',
  height = 200,
  horizontal = false
}) {
  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: color + '66',
      hoverBackgroundColor: color,
      borderColor: color,
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(18, 22, 38, 0.95)',
        titleColor: '#E5E7EB',
        bodyColor: '#9CA3AF',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: '#6B7280', font: { size: 11, family: 'Inter' } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: '#6B7280', font: { size: 11, family: 'Inter' } },
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    }
  }

  return (
    <div style={{ height, position: 'relative' }}>
      <Bar data={data} options={options} />
    </div>
  )
}
