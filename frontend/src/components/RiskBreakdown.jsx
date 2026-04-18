import React from 'react'
import { motion } from 'framer-motion'

const GlassCard = ({ children, style }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, rgba(18, 22, 38, 0.7), rgba(27, 27, 47, 0.4))',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '20px',
      padding: '28px',
      backdropFilter: 'blur(16px)',
      transition: 'all 300ms ease',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    {children}
  </div>
)

export default function RiskBreakdown({ anomalies, benfordRisk, fuzzyMatchCount }) {
  const avgAnomalyScore = anomalies?.length ? (anomalies.reduce((sum, a) => sum + (a.is_anomaly ? 50 : 0), 0) / anomalies.length) : 0
  const vendorScore = (fuzzyMatchCount / Math.max(anomalies?.length || 1, 1)) * 30
  const benfordScore = Math.min((benfordRisk || 0), 100) * 0.2

  const components = [
    {
      name: 'Anomaly Detection',
      subtitle: 'Isolation Forest',
      percentage: Math.round(avgAnomalyScore),
      weight: '50%',
      color: '#3b82f6',
      gradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.2)',
      description: 'Detects unusual transaction patterns and statistical outliers',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: 'Vendor Match',
      subtitle: 'Fuzzy Matching',
      percentage: Math.round(vendorScore),
      weight: '30%',
      color: '#ef4444',
      gradient: 'linear-gradient(90deg, #ef4444, #f87171)',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
      description: 'Identifies suspicious vendor duplicate/similarity patterns',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: "Benford's Law",
      subtitle: 'Digit Distribution',
      percentage: Math.round(benfordScore),
      weight: '20%',
      color: '#f59e0b',
      gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.2)',
      description: 'Checks first-digit distribution for data manipulation',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
  ]

  const avgRisk = ((components.reduce((sum, c) => sum + c.percentage, 0) / components.length) || 0)
  const riskColor = avgRisk >= 50 ? '#ef4444' : avgRisk >= 25 ? '#f59e0b' : '#22c55e'

  return (
    <GlassCard>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #3b82f6, #ef4444, #f59e0b)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(239, 68, 68, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>
            📊
          </div>
          <div>
            <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #fff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Explainable Risk Breakdown
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>How we calculate fraud risk for each transaction</p>
          </div>
        </div>

        {/* Average Risk Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '12px',
          background: `${riskColor}12`,
          border: `1px solid ${riskColor}30`,
        }}>
          <span style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Avg Risk</span>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            fontFamily: "'Poppins', sans-serif",
            color: riskColor,
          }}>
            {avgRisk.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Risk Component Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {components.map((comp, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              padding: '18px 20px',
              borderRadius: '14px',
              background: comp.bg,
              border: `1px solid ${comp.border}`,
              transition: 'all 250ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${comp.color}50`
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${comp.color}35`
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: `${comp.color}18`,
                  color: comp.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {comp.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#E5E7EB', margin: 0 }}>{comp.name}</p>
                  <p style={{ fontSize: '0.68rem', color: '#6B7280', margin: '1px 0 0 0' }}>{comp.subtitle} · {comp.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  fontFamily: "'Poppins', sans-serif",
                  color: comp.color,
                }}>
                  {comp.percentage}%
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  color: '#6B7280',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.04)',
                }}>
                  w:{comp.weight}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '6px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${comp.percentage}%` }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  height: '100%',
                  borderRadius: '4px',
                  background: comp.gradient,
                  boxShadow: `0 0 8px ${comp.color}30`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Formula Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          padding: '18px 22px',
          borderRadius: '14px',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <p style={{
          fontSize: '0.7rem',
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
          margin: '0 0 14px 0',
        }}>
          Risk Calculation Formula
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {components.map((comp, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span style={{ fontSize: '1rem', color: '#475569', fontWeight: 300 }}>+</span>}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: `${comp.color}10`,
                border: `1px solid ${comp.color}20`,
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: comp.color,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.75rem', color: '#E5E7EB', fontWeight: 600 }}>
                  {comp.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: comp.color, fontWeight: 700 }}>
                  {comp.weight}
                </span>
              </div>
            </React.Fragment>
          ))}
          <span style={{ fontSize: '1rem', color: '#475569', fontWeight: 300 }}>=</span>
          <div style={{
            padding: '6px 16px',
            borderRadius: '8px',
            background: `${riskColor}15`,
            border: `1px solid ${riskColor}30`,
          }}>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              fontFamily: "'Poppins', sans-serif",
              color: riskColor,
            }}>
              {avgRisk.toFixed(0)}% Risk
            </span>
          </div>
        </div>
      </motion.div>
    </GlassCard>
  )
}
