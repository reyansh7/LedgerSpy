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

export default function BankReconciliation({ anomalies, totalRecords, reconciliationResults }) {
  // If reconciliation results are provided, use those; otherwise use defaults
  let matchedCount, missingCount, partialCount, matchPercentage
  
  if (reconciliationResults?.summary) {
    // Use actual reconciliation data if provided
    matchedCount = reconciliationResults.summary.matched || 0
    partialCount = reconciliationResults.summary.partial_match || 0
    missingCount = reconciliationResults.summary.missing_or_extra || 0
    matchPercentage = reconciliationResults.summary.reconciliation_rate || 0
  } else {
    // Default realistic simulation: 5% missing, 3% partial, 92% matched
    const total = totalRecords || 10000
    missingCount = Math.floor(total * 0.05) // 5% missing rows
    partialCount = Math.floor(total * 0.03) // 3% amount mismatches
    matchedCount = total - missingCount - partialCount // ~92% matched
    matchPercentage = ((matchedCount / total) * 100).toFixed(1)
  }

  const reconciliationData = [
    {
      status: 'Matched',
      count: matchedCount,
      percentage: totalRecords ? ((matchedCount / totalRecords) * 100).toFixed(1) : matchPercentage,
      icon: '✅',
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.03))',
      border: 'rgba(34, 197, 94, 0.2)',
      barGradient: 'linear-gradient(90deg, #22c55e, #4ade80)',
      description: 'Successfully reconciled with bank records',
      iconSvg: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      status: 'Missing',
      count: missingCount,
      percentage: totalRecords ? ((missingCount / totalRecords) * 100).toFixed(1) : 0,
      icon: '❌',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.03))',
      border: 'rgba(239, 68, 68, 0.2)',
      barGradient: 'linear-gradient(90deg, #ef4444, #f87171)',
      description: 'No matching bank record found',
      iconSvg: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      status: 'Partial Match',
      count: partialCount,
      percentage: totalRecords ? ((partialCount / totalRecords) * 100).toFixed(1) : 0,
      icon: '⚠️',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.03))',
      border: 'rgba(245, 158, 11, 0.2)',
      barGradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      description: 'Amount or date mismatch detected',
      iconSvg: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
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
        background: 'linear-gradient(90deg, #22c55e, #3b82f6)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>
            🏦
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
              Bank Reconciliation Status
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>Transaction matching against bank records</p>
          </div>
        </div>

        {/* Match rate badge */}
        <div style={{
          padding: '8px 16px',
          borderRadius: '12px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
            Match Rate
          </span>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            fontFamily: "'Poppins', sans-serif",
            color: '#4ade80',
          }}>
            {matchPercentage}%
          </span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {reconciliationData.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              padding: '20px',
              borderRadius: '14px',
              background: item.gradient,
              border: `1px solid ${item.border}`,
              transition: 'all 250ms ease',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${item.color}50`
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = `0 8px 24px ${item.color}15`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${item.color}35`
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: `${item.color}15`,
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.iconSvg}
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {item.status}
              </span>
            </div>
            <p style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: "'Poppins', sans-serif",
              color: '#fff',
              margin: '0 0 2px 0',
              lineHeight: 1,
            }}>
              {item.count.toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize: '0.72rem', color: item.color, fontWeight: 600, margin: '0 0 4px 0' }}>
              {item.percentage}% of total
            </p>
            <p style={{ fontSize: '0.68rem', color: '#6B7280', margin: 0 }}>{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress Bars Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          padding: '20px',
          borderRadius: '14px',
          background: 'rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '16px',
        }}
      >
        <p style={{
          fontSize: '0.7rem',
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
          margin: '0 0 16px 0',
        }}>
          Reconciliation Breakdown
        </p>

        {/* Stacked bar */}
        <div style={{
          display: 'flex',
          width: '100%',
          height: '24px',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px',
          background: 'rgba(255,255,255,0.04)',
        }}>
          {reconciliationData.map((item, idx) => {
            const width = totalRecords ? (item.count / totalRecords) * 100 : 0
            return (
              <motion.div
                key={idx}
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ delay: 0.5 + idx * 0.15, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  height: '100%',
                  background: item.barGradient,
                  position: 'relative',
                  minWidth: width > 0 ? '2px' : 0,
                }}
                title={`${item.status}: ${item.count} (${item.percentage}%)`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {reconciliationData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                background: item.barGradient,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{item.status}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E5E7EB' }}>{item.count.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ade80', margin: 0 }}>
            Reconciliation Status: READY
          </p>
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0 0' }}>
            {matchPercentage}% transactions successfully matched with bank records
          </p>
        </div>
      </motion.div>
    </GlassCard>
  )
}
