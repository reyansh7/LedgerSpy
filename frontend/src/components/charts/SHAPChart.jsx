import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const defaultFeatures = [
  { label: 'Amount', value: +4.68, color: '#EF4444' },
  { label: 'Vendor Match', value: +3.21, color: '#EF4444' },
  { label: 'Benford Dev', value: +4.21, color: '#EF4444' },
  { label: 'Transaction Freq.', value: -1.56, color: '#22C55E' },
  { label: 'Day of Week', value: -0.85, color: '#22C55E' },
  { label: 'Category', value: +1.12, color: '#F5860B' },
]

export default function SHAPChart({ features = defaultFeatures }) {
  const barsRef = useRef(null)
  const maxAbsValue = Math.max(...features.map(f => Math.abs(f.value)), 5)

  useEffect(() => {
    if (!barsRef.current) return
    const fills = barsRef.current.querySelectorAll('.shap-bar__fill')
    gsap.fromTo(fills,
      { width: 0 },
      { width: (i) => {
        const pct = (Math.abs(features[i].value) / maxAbsValue) * 45
        return `${pct}%`
      }, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
    )
  }, [features, maxAbsValue])

  return (
    <div className="shap-chart" ref={barsRef}>
      {features.map((feat, i) => {
        const pct = (Math.abs(feat.value) / maxAbsValue) * 45
        const isPositive = feat.value >= 0
        const color = feat.value >= 2 ? '#EF4444' : feat.value >= 0 ? '#F5860B' : '#22C55E'

        return (
          <div className="shap-bar" key={i}>
            <span className="shap-bar__label">{feat.label}</span>
            <div className="shap-bar__track">
              <div className="shap-bar__center-line" />
              <div
                className={`shap-bar__fill shap-bar__fill--${isPositive ? 'positive' : 'negative'}`}
                style={{
                  width: 0,
                  background: color,
                  ...(isPositive
                    ? { left: '50%' }
                    : { right: '50%', left: 'auto' }
                  )
                }}
              />
            </div>
            <span className="shap-bar__value" style={{ color }}>
              {isPositive ? '+' : ''}{feat.value.toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
