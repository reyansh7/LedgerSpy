import React, { useRef, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function LineChart({ labels, datasets, height = 260 }) {
  const chartRef = useRef(null)

  const defaultLabels = labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  const defaultDatasets = datasets || [
    {
      label: 'Risk Score',
      data: [30, 45, 35, 60, 55, 70, 65, 75],
      borderColor: '#BB5CF6',
      backgroundColor: (ctx) => {
        const chart = ctx.chart
        const { ctx: context, chartArea } = chart
        if (!chartArea) return 'rgba(187, 92, 246, 0.1)'
        const gradient = context.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(187, 92, 246, 0.3)')
        gradient.addColorStop(1, 'rgba(187, 92, 246, 0.0)')
        return gradient
      },
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#BB5CF6',
      pointBorderColor: '#BB5CF6',
      pointRadius: 4,
      pointHoverRadius: 7,
      borderWidth: 2.5,
    }
  ]

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
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
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255,255,255,0.04)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: { size: 11, family: 'Inter' },
        },
      },
      y: {
        grid: {
          color: 'rgba(255,255,255,0.04)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: { size: 11, family: 'Inter' },
        },
      },
    },
  }

  return (
    <div style={{ height, position: 'relative' }}>
      <Line ref={chartRef} data={{ labels: defaultLabels, datasets: defaultDatasets }} options={options} />
    </div>
  )
}
