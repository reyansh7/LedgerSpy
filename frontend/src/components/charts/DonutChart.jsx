import React, { useRef, useEffect } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function DonutChart({
  values = [21.8, 28.7, 49.5],
  labels = ['High Risk', 'Medium Risk', 'Low Risk'],
  colors = ['#EF4444', '#F5860B', '#22C55E'],
  centerValue = '2.8k',
  centerLabel = 'High Risk',
  size = 220
}) {
  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: 'rgba(11, 15, 26, 0.8)',
      borderWidth: 3,
      hoverBorderColor: 'rgba(11, 15, 26, 0.8)',
      hoverOffset: 6,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
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
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`
        }
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <Doughnut data={data} options={options} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}>
        <span style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: '1.6rem',
          fontWeight: 700,
          color: '#E5E7EB',
          lineHeight: 1,
        }}>
          {centerValue}
        </span>
        <span style={{
          fontSize: '0.65rem',
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {centerLabel}
        </span>
      </div>
    </div>
  )
}
