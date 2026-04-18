import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function StatCard({ label, value, icon, color = 'purple', change, changeDir = 'up' }) {
  const cardRef = useRef(null)
  const valueRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    const valueEl = valueRef.current

    // Card entrance animation
    gsap.fromTo(card,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
    )

    // Number count-up animation
    const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, ''))
    if (!isNaN(numericValue) && numericValue > 0) {
      const obj = { val: 0 }
      const isPercentage = String(value).includes('%')
      const isDecimal = String(value).includes('.')
      const prefix = String(value).match(/^[^0-9]*/)?.[0] || ''
      const suffix = String(value).match(/[^0-9.]*$/)?.[0] || ''

      gsap.to(obj, {
        val: numericValue,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          if (valueEl) {
            let displayVal = isDecimal
              ? obj.val.toFixed(1)
              : Math.floor(obj.val).toLocaleString()
            valueEl.textContent = prefix + displayVal + suffix
          }
        }
      })
    }

    // 3D tilt on hover
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -5
      const rotateY = ((x - centerX) / centerX) * 5

      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 800
      })
    }

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      })
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [value])

  return (
    <div className="stat-card" ref={cardRef}>
      <div className="stat-card__header">
        <div className={`stat-card__icon stat-card__icon--${color}`}>
          {icon}
        </div>
        {change && (
          <span className={`stat-card__change stat-card__change--${changeDir}`}>
            {changeDir === 'up' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value" ref={valueRef}>{value}</span>
    </div>
  )
}
