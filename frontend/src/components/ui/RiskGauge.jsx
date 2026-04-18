import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function RiskGauge({ score = 0, size = 160, strokeWidth = 10 }) {
  const gaugeRef = useRef(null)
  const scoreRef = useRef(null)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fillAmount = (score / 100) * circumference
  const dashOffset = circumference - fillAmount

  const getColor = (score) => {
    if (score >= 80) return '#EF4444'
    if (score >= 60) return '#F5860B'
    if (score >= 40) return '#EAB308'
    return '#22C55E'
  }

  const getLabel = (score) => {
    if (score >= 80) return 'High Risk'
    if (score >= 60) return 'Medium Risk'
    if (score >= 40) return 'Moderate'
    return 'Low Risk'
  }

  const color = getColor(score)

  useEffect(() => {
    const circle = gaugeRef.current
    const scoreEl = scoreRef.current

    if (circle) {
      gsap.fromTo(circle,
        { strokeDashoffset: circumference },
        { strokeDashoffset: dashOffset, duration: 1.5, ease: 'power3.out', delay: 0.3 }
      )
    }

    if (scoreEl) {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: score,
        duration: 1.5,
        ease: 'power2.out',
        delay: 0.3,
        onUpdate: () => {
          if (scoreEl) scoreEl.textContent = Math.floor(obj.val)
        }
      })
    }
  }, [score, circumference, dashOffset])

  return (
    <div className="risk-gauge" style={{ width: size, height: size }}>
      <svg className="risk-gauge__svg" width={size} height={size}>
        <circle
          className="risk-gauge__bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          ref={gaugeRef}
          className="risk-gauge__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div className="risk-gauge__center">
        <span className="risk-gauge__score" ref={scoreRef} style={{ color }}>0</span>
        <span className="risk-gauge__label" style={{ color }}>{getLabel(score)}</span>
      </div>
    </div>
  )
}
