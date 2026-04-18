import React, { useState } from 'react'
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

export default function AuditReportGenerator({ results }) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const totalRecords = results?.summary?.total_records || 0
  const flaggedRecords = results?.summary?.flagged_records || 0
  const benfordRisk = results?.summary?.benford_risk || 0
  const fuzzyMatches = results?.summary?.fuzzy_match_count || 0
  const flaggedPct = totalRecords ? ((flaggedRecords / totalRecords) * 100).toFixed(2) : 0

  const report = `
FRAUD DETECTION AUDIT REPORT
${'='.repeat(60)}

Generated: ${new Date().toLocaleDateString('en-IN', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
File ID: ${results?.file_id || 'N/A'}

EXECUTIVE SUMMARY
${'─'.repeat(60)}
Total Transactions Analyzed: ${totalRecords.toLocaleString('en-IN')}
Suspicious Transactions: ${flaggedRecords} (${flaggedPct}%)
Benford's Law Risk: ${benfordRisk}%
Duplicate Vendor Alerts: ${fuzzyMatches}

KEY FINDINGS
${'─'.repeat(60)}

1. ANOMALY DETECTION
   • ${flaggedRecords} transactions flagged by Isolation Forest algorithm
   • Analysis identifies unusual patterns and statistical outliers
   • Represents ${flaggedPct}% of total transaction volume

2. VENDOR ANALYSIS
   • ${fuzzyMatches} suspicious vendor pairs detected
   • Possible duplicates indicate potential fraud schemes
   • Requires manual reconciliation and consolidation

3. BENFORD'S LAW ANALYSIS
   • Deviation level: ${benfordRisk}%
   • Benford's Law predicts first-digit distribution in authentic data
   • High deviation suggests possible data manipulation or fraud

RISK CLASSIFICATION
${'─'.repeat(60)}
🔴 HIGH RISK:    ${flaggedRecords >= 100 ? 'CRITICAL - Immediate action required' : 'Several transactions exceed 70% risk threshold'}
⚠️  MEDIUM RISK:  Requires secondary review and verification
🟢 LOW RISK:     Cleared by all detection mechanisms

RECOMMENDED ACTIONS
${'─'.repeat(60)}
1. Review high-risk transactions (score > 70) immediately
2. Verify duplicate vendor records with procurement team
3. Investigate Benford's Law deviations for data integrity
4. Reconcile with bank statements and records
5. Update vendor master database
6. Consider implementing transaction monitoring rules

${'═'.repeat(60)}
Report End
`.trim()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadReport = () => {
    const element = document.createElement('a')
    const file = new Blob([report], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `audit-report-${results?.file_id || 'export'}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const summaryMetrics = [
    { label: 'Total Records', value: totalRecords.toLocaleString('en-IN'), color: '#22d3ee', icon: '📄' },
    { label: 'Flagged', value: flaggedRecords, color: '#f87171', icon: '🚨' },
    { label: 'Benford Risk', value: `${benfordRisk}%`, color: '#fbbf24', icon: '📊' },
    { label: 'Vendor Alerts', value: fuzzyMatches, color: '#a78bfa', icon: '👥' },
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
        background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>
            📝
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
              Automated Audit Report
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>
              Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={copyToClipboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.4)' : 'rgba(6, 182, 212, 0.3)'}`,
              background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(6, 182, 212, 0.08)',
              color: copied ? '#4ade80' : '#22d3ee',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              )}
            </svg>
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={downloadReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              background: 'rgba(34, 197, 94, 0.08)',
              color: '#4ade80',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download .txt
          </motion.button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {summaryMetrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: `${metric.color}08`,
              border: `1px solid ${metric.color}20`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{metric.icon}</span>
            <div>
              <p style={{ fontSize: '0.62rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, margin: 0 }}>
                {metric.label}
              </p>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                fontFamily: "'Poppins', sans-serif",
                color: metric.color,
                margin: '2px 0 0 0',
              }}>
                {metric.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Report Preview Toggle */}
      <div style={{
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'rgba(0,0,0,0.2)',
            border: 'none',
            cursor: 'pointer',
            color: '#E5E7EB',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Report Preview
          </div>
          <motion.svg
            width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={2}
            animate={{ rotate: showPreview ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <pre style={{
              padding: '20px 24px',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontSize: '0.72rem',
              color: '#9CA3AF',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '400px',
              overflowY: 'auto',
              margin: 0,
            }}>
              {report}
            </pre>
          </motion.div>
        )}
      </div>
    </GlassCard>
  )
}
