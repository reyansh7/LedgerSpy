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

function SimilarityBar({ score }) {
  const color = score >= 90 ? '#ef4444' : score >= 80 ? '#f59e0b' : '#3b82f6'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', marginTop: '4px' }}>
      <div style={{
        flex: 1,
        height: '5px',
        borderRadius: '4px',
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            height: '100%',
            borderRadius: '4px',
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
      <span style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: '1rem',
        fontWeight: 800,
        color,
        minWidth: '48px',
        textAlign: 'right',
      }}>
        {score}%
      </span>
    </div>
  )
}

function RiskTag({ score }) {
  const config = score >= 90
    ? { label: 'Very High', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' }
    : score >= 80
    ? { label: 'High', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' }
    : { label: 'Medium', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      padding: '3px 10px',
      borderRadius: '8px',
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.border}`,
    }}>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: config.color,
        boxShadow: `0 0 4px ${config.color}`,
      }} />
      {config.label} Risk
    </span>
  )
}

export default function VendorSimilarityDetection({ fuzzyMatches }) {
  const [expanded, setExpanded] = useState(null)

  if (!fuzzyMatches?.length) {
    return (
      <GlassCard>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #22c55e, #22c55e66)',
          borderRadius: '20px 20px 0 0',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>
            🔗
          </div>
          <h3 style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Vendor Similarity Detection
          </h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          marginTop: '16px',
        }}>
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 600 }}>No suspicious vendor duplicates detected</span>
        </div>
      </GlassCard>
    )
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
        background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              🔗
            </div>
            <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #fff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Vendor Similarity Detection
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '0 0 0 48px' }}>
            Detected <strong style={{ color: '#f87171' }}>{fuzzyMatches.length}</strong> suspicious vendor pairs
          </p>
        </div>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '10px',
          padding: '6px 14px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#f87171',
        }}>
          {fuzzyMatches.length} Alerts
        </div>
      </div>

      {/* Vendor Pairs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {fuzzyMatches.map((match, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            style={{
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.05)',
              background: expanded === idx ? 'rgba(239, 68, 68, 0.04)' : 'rgba(0,0,0,0.12)',
              padding: '16px 20px',
              cursor: 'pointer',
              transition: 'all 250ms ease',
            }}
            onMouseEnter={(e) => {
              if (expanded !== idx) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
            }}
            onMouseLeave={(e) => {
              if (expanded !== idx) e.currentTarget.style.background = 'rgba(0,0,0,0.12)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    color: '#a78bfa',
                    flexShrink: 0,
                  }}>A</div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {match.vendor_1}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '2px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    color: '#22d3ee',
                    flexShrink: 0,
                  }}>B</div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {match.vendor_2}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <RiskTag score={match.risk_score} />
                <SimilarityBar score={match.risk_score} />
              </div>
            </div>

            {/* Expanded Detail */}
            <AnimatePresence>
              {expanded === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    marginTop: '14px',
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem' }}>💡</span>
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E5E7EB', margin: 0 }}>Assessment</p>
                        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0 0' }}>
                          Possible duplicate vendor — may indicate a typo, data entry error, or intentional obfuscation for fraudulent purposes.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem' }}>🔧</span>
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E5E7EB', margin: 0 }}>Recommended Action</p>
                        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0 0' }}>
                          Consolidate vendor records or investigate for potential fraudulent activity. Cross-reference with procurement records.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
