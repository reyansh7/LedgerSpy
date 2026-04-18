import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

function MiniRiskGauge({ score, size = 44 }) {
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f59e0b' : '#3b82f6'
  const radius = (size - 5) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(score, 100) / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 4px ${color}40)`, transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.6rem',
        fontWeight: 800,
        color,
        fontFamily: "'Poppins', sans-serif",
      }}>
        {score.toFixed(0)}
      </div>
    </div>
  )
}

export default function ExplainableAIPanel({ anomalies }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = anomalies?.[selectedIdx]

  if (!anomalies?.length) return null

  const getRecommendation = (score) => {
    if (score >= 80) return {
      priority: 'HIGH PRIORITY',
      icon: '🔴',
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
      text: 'Manual review required. Consider blocking this transaction pending investigation.',
    }
    if (score >= 60) return {
      priority: 'MEDIUM PRIORITY',
      icon: '⚠️',
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.2)',
      text: 'Flag for secondary review. Verify vendor details and transaction purpose.',
    }
    return {
      priority: 'LOW PRIORITY',
      icon: '🔵',
      color: '#60a5fa',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.2)',
      text: 'Monitor similar patterns. Update fraud detection model if confirmed legitimate.',
    }
  }

  return (
    <GlassCard>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
        }}>
          🧠
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
            Explainable AI Panel
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>Understand WHY each transaction was flagged as suspicious</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Left - Transaction Selector */}
        <div>
          <p style={{
            fontSize: '0.7rem',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            fontWeight: 600,
            margin: '0 0 10px 0',
          }}>
            Select Transaction
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '360px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}>
            {anomalies.map((item, idx) => {
              const isActive = selectedIdx === idx
              const riskColor = item.risk_score >= 80 ? '#ef4444' : item.risk_score >= 60 ? '#f59e0b' : '#3b82f6'
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${isActive ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.04)'}`,
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.05))'
                      : 'rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 200ms ease',
                    width: '100%',
                  }}
                >
                  <MiniRiskGauge score={item.risk_score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.75rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      color: isActive ? '#a78bfa' : '#E5E7EB',
                      margin: 0,
                    }}>
                      {item.transaction_id}
                    </p>
                    <p style={{
                      fontSize: '0.7rem',
                      color: '#9CA3AF',
                      margin: '2px 0 0 0',
                    }}>
                      ₹{(item.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Right - Detail Panel */}
        <div>
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selectedIdx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* Transaction Summary Card */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                }}>
                  {[
                    { label: 'Transaction ID', value: selected.transaction_id, color: '#22d3ee', mono: true },
                    { label: 'Amount', value: `₹${(selected.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#E5E7EB' },
                    { label: 'Risk Score', value: `${selected.risk_score.toFixed(1)} / 100`, color: selected.risk_score >= 80 ? '#f87171' : selected.risk_score >= 60 ? '#fbbf24' : '#60a5fa' },
                  ].map((field) => (
                    <div
                      key={field.label}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <p style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, margin: 0 }}>
                        {field.label}
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: field.color,
                        fontFamily: field.mono ? "'JetBrains Mono', monospace" : "'Poppins', sans-serif",
                        margin: '4px 0 0 0',
                      }}>
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Risk Factors */}
                <div>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#E5E7EB',
                    margin: '0 0 10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Why This Transaction Was Flagged
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selected.explanation?.map((exp, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(239, 68, 68, 0.04)',
                          borderLeft: '3px solid rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.15)',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: 1.5 }}>{exp}</span>
                      </motion.div>
                    ))}
                    {(!selected.explanation || selected.explanation.length === 0) && (
                      <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>No detailed explanation available for this transaction.</p>
                    )}
                  </div>
                </div>

                {/* Recommendation */}
                {(() => {
                  const rec = getRecommendation(selected.risk_score)
                  return (
                    <div style={{
                      padding: '16px 20px',
                      borderRadius: '12px',
                      background: rec.bg,
                      border: `1px solid ${rec.border}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}>
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{rec.icon}</span>
                      <div>
                        <p style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          color: rec.color,
                          margin: '0 0 4px 0',
                        }}>
                          {rec.priority}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#9CA3AF', lineHeight: 1.5, margin: 0 }}>
                          {rec.text}
                        </p>
                      </div>
                    </div>
                  )
                })()}

                {/* Primary Reason for Flagging */}
                {selected.primary_reason && (
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(139, 92, 246, 0.06)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    <p style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#a78bfa',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      📊 Primary Flagging Reason
                    </p>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#d1d5db',
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {selected.primary_reason}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .xai-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </GlassCard>
  )
}
