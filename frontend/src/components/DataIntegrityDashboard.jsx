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

function CircularGauge({ value, size = 80, strokeWidth = 6, color }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: '1.1rem',
          fontWeight: 800,
          fontFamily: "'Poppins', sans-serif",
          color: '#fff',
          lineHeight: 1,
        }}>
          {value.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

export default function DataIntegrityDashboard({ readinessReport, totalRecords }) {
  const readinessScore = readinessReport?.readiness_score || 0
  const completeness = parseFloat(readinessReport?.completeness) || 0
  const dataQuality = readinessReport?.data_quality || 'Unknown'

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const getScoreConfig = (score) => {
    if (score >= 80) return {
      label: 'Audit-Ready',
      icon: '✅',
      message: 'All integrity checks passed. Safe to proceed with analysis.',
      bg: 'rgba(34, 197, 94, 0.06)',
      border: 'rgba(34, 197, 94, 0.2)',
      textColor: '#4ade80',
    }
    if (score >= 60) return {
      label: 'Needs Attention',
      icon: '⚠️',
      message: 'Some missing values detected. Consider data cleaning before full audit.',
      bg: 'rgba(245, 158, 11, 0.06)',
      border: 'rgba(245, 158, 11, 0.2)',
      textColor: '#fbbf24',
    }
    return {
      label: 'Requires Review',
      icon: '🔴',
      message: 'Significant data quality issues detected. Manual review recommended.',
      bg: 'rgba(239, 68, 68, 0.06)',
      border: 'rgba(239, 68, 68, 0.2)',
      textColor: '#f87171',
    }
  }

  const scoreColor = getScoreColor(readinessScore)
  const scoreConfig = getScoreConfig(readinessScore)

  const metrics = [
    {
      label: 'Completeness',
      value: `${completeness.toFixed(1)}%`,
      sub: 'of required fields',
      color: '#22d3ee',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'Total Records',
      value: (totalRecords || 0).toLocaleString(),
      sub: 'transactions analyzed',
      color: '#3b82f6',
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
    },
  ]

  const qualityChecks = [
    { label: 'Completeness', value: `${readinessReport?.completeness || 0}%`, pass: (readinessReport?.completeness || 0) >= 95 },
    { label: 'Format Validity', value: `${readinessReport?.format_validity || 0}%`, pass: (readinessReport?.format_validity || 0) >= 90 },
    { label: 'Consistency', value: `${readinessReport?.consistency || 0}%`, pass: (readinessReport?.consistency || 0) >= 80 },
    { label: 'Statistical', value: `${readinessReport?.statistical_health || 0}%`, pass: (readinessReport?.statistical_health || 0) >= 70 },
  ]

  return (
    <GlassCard>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}66)`,
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.1))',
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
            Data Integrity Dashboard
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>Quality assessment of your uploaded ledger data</p>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '20px',
      }}>
        {/* Readiness Score - takes focus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: '20px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${scoreColor}10, ${scoreColor}05)`,
            border: `1px solid ${scoreColor}30`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CircularGauge value={readinessScore} color={scoreColor} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, margin: 0 }}>
              Readiness
            </p>
            <p style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: scoreColor,
              margin: '2px 0 0 0',
            }}>
              {dataQuality}
            </p>
          </div>
        </motion.div>

        {/* Completeness & Total Records */}
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + idx * 0.08 }}
            style={{
              padding: '20px',
              borderRadius: '14px',
              background: 'rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <p style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, margin: 0 }}>
                {metric.label}
              </p>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: `${metric.color}15`,
                color: metric.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {metric.icon}
              </div>
            </div>
            <div>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                fontFamily: "'Poppins', sans-serif",
                color: '#fff',
                margin: 0,
                lineHeight: 1.1,
              }}>
                {metric.value}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#6B7280', margin: '4px 0 0 0' }}>{metric.sub}</p>
            </div>
          </motion.div>
        ))}

        {/* Quality Checks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            padding: '20px',
            borderRadius: '14px',
            background: 'rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <p style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, margin: '0 0 14px 0' }}>
            Quality Checks
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {qualityChecks.map((check) => (
              <div key={check.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  background: check.pass ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  flexShrink: 0,
                }}>
                  {check.pass ? '✓' : '✕'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.78rem', color: '#E5E7EB', margin: 0 }}>{check.label}</p>
                  <p style={{ fontSize: '0.65rem', color: '#6B7280', margin: 0 }}>{check.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 20px',
          borderRadius: '12px',
          background: scoreConfig.bg,
          border: `1px solid ${scoreConfig.border}`,
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>{scoreConfig.icon}</span>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: scoreConfig.textColor, margin: 0 }}>
            Data Status: {scoreConfig.label}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0 0' }}>
            {scoreConfig.message}
          </p>
        </div>
      </motion.div>

      {/* Issues and Recommendations - Show if quality is not excellent */}
      {readinessScore < 90 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            marginTop: '16px',
          }}
        >
          {/* Issues */}
          {readinessReport?.issues?.length > 0 && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}>
              <p style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Issues Detected
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {readinessReport.issues.slice(0, 3).map((issue, idx) => (
                  <p key={idx} style={{ fontSize: '0.7rem', color: '#fca5a5', margin: 0 }}>
                    • {issue}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {readinessReport?.recommendations?.length > 0 && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
            }}>
              <p style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Recommendations
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {readinessReport.recommendations.slice(0, 3).map((rec, idx) => (
                  <p key={idx} style={{ fontSize: '0.7rem', color: '#86efac', margin: 0 }}>
                    • {rec}
                  </p>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Responsive override */}
      <style>{`
        @media (max-width: 1024px) {
          .data-integrity-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .data-integrity-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </GlassCard>
  )
}
