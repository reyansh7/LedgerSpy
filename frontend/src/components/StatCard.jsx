import React from 'react'
import { motion } from 'framer-motion'

const iconMap = {
  primary: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  warning: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  danger: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  success: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

const colorSchemes = {
  primary: {
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.08))',
    border: 'rgba(6, 182, 212, 0.25)',
    borderHover: 'rgba(6, 182, 212, 0.5)',
    iconBg: 'rgba(6, 182, 212, 0.15)',
    iconColor: '#22d3ee',
    accentLine: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
    glowColor: 'rgba(6, 182, 212, 0.15)',
    valueColor: '#e0f7ff',
  },
  warning: {
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))',
    border: 'rgba(245, 158, 11, 0.25)',
    borderHover: 'rgba(245, 158, 11, 0.5)',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    iconColor: '#fbbf24',
    accentLine: 'linear-gradient(90deg, #f59e0b, #ef4444)',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    valueColor: '#fff3cd',
  },
  danger: {
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(236, 72, 153, 0.08))',
    border: 'rgba(239, 68, 68, 0.25)',
    borderHover: 'rgba(239, 68, 68, 0.5)',
    iconBg: 'rgba(239, 68, 68, 0.15)',
    iconColor: '#f87171',
    accentLine: 'linear-gradient(90deg, #ef4444, #ec4899)',
    glowColor: 'rgba(239, 68, 68, 0.15)',
    valueColor: '#fecaca',
  },
  success: {
    gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(6, 182, 212, 0.08))',
    border: 'rgba(34, 197, 94, 0.25)',
    borderHover: 'rgba(34, 197, 94, 0.5)',
    iconBg: 'rgba(34, 197, 94, 0.15)',
    iconColor: '#4ade80',
    accentLine: 'linear-gradient(90deg, #22c55e, #06b6d4)',
    glowColor: 'rgba(34, 197, 94, 0.15)',
    valueColor: '#dcfce7',
  },
}

export default function StatCard({ title, value, color = 'primary' }) {
  const scheme = colorSchemes[color] || colorSchemes.primary
  const icon = iconMap[color] || iconMap.primary

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        position: 'relative',
        background: scheme.gradient,
        border: `1px solid ${scheme.border}`,
        borderRadius: '16px',
        padding: '24px',
        overflow: 'hidden',
        cursor: 'default',
        backdropFilter: 'blur(16px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = scheme.borderHover
        e.currentTarget.style.boxShadow = `0 8px 32px ${scheme.glowColor}, 0 0 0 1px ${scheme.border}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = scheme.border
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: scheme.accentLine,
          borderRadius: '16px 16px 0 0',
        }}
      />

      {/* Subtle decorative orb */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: scheme.iconColor,
          opacity: 0.06,
          filter: 'blur(20px)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#9CA3AF', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
          {title}
        </p>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: scheme.iconBg,
            color: scheme.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: scheme.valueColor,
          fontFamily: "'Poppins', sans-serif",
          lineHeight: 1.1,
          margin: 0,
          position: 'relative',
        }}
      >
        {value}
      </motion.p>
    </motion.div>
  )
}
