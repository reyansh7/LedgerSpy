import React, { useState } from 'react'
import { motion } from 'framer-motion'
import html2pdf from 'html2pdf.js'

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
    const element = document.createElement('div')
    const currentDate = new Date()
    
    element.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; background: white; color: #1e293b;">
        
        <!-- Header Section -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 4px solid #8b5cf6; padding-bottom: 30px;">
          <div>
            <h1 style="margin: 0; color: #8b5cf6; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">FRAUD DETECTION AUDIT REPORT</h1>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">LedgerSpy Financial Audit System</p>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 500;">Comprehensive Risk Analysis & Detection Report</p>
          </div>
          <div style="text-align: right; font-size: 13px; color: #475569; background: #f8fafc; padding: 20px; border-radius: 8px;">
            <p style="margin: 0; font-weight: 600;">Report Date</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700;">${currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p style="margin: 4px 0 0 0;">Time: ${currentDate.toLocaleTimeString()}</p>
            <p style="margin: 8px 0 0 0; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 12px;">File ID: ${results?.file_id || 'N/A'}</p>
          </div>
        </div>

        <!-- Executive Summary -->
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            <span style="display: inline-block; width: 4px; height: 24px; background: #8b5cf6; border-radius: 2px;"></span>
            EXECUTIVE SUMMARY
          </h2>
          <p style="margin: 0 0 12px 0; color: #475569; line-height: 1.6; font-size: 14px;">
            This comprehensive fraud detection audit report analyzes ${totalRecords.toLocaleString('en-US')} financial transactions using advanced anomaly detection, Benford's Law analysis, and vendor similarity matching algorithms.
          </p>
          <p style="margin: 0; color: #475569; line-height: 1.6; font-size: 14px;">
            <strong>${flaggedRecords} transactions (${flaggedPct}%) have been flagged as high-risk</strong> based on multiple detection methodologies. This report provides detailed insights into these suspicious activities and recommendations for further investigation.
          </p>
        </div>

        <!-- Key Metrics Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
          <div style="padding: 20px; background: #f0f9ff; border-left: 5px solid #0284c7; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #0c4a6e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total Records</p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 800; color: #0284c7;">${totalRecords.toLocaleString('en-US')}</p>
          </div>
          <div style="padding: 20px; background: #fef2f2; border-left: 5px solid #dc2626; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #7f1d1d; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Flagged Transactions</p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 800; color: #dc2626;">${flaggedRecords}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #991b1b;">${flaggedPct}% of total</p>
          </div>
          <div style="padding: 20px; background: #fef3c7; border-left: 5px solid #d97706; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #78350f; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Benford Risk</p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 800; color: #d97706;">${benfordRisk}%</p>
          </div>
          <div style="padding: 20px; background: #faf5ff; border-left: 5px solid #a855f7; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #6b21a8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Vendor Alerts</p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 800; color: #a855f7;">${fuzzyMatches}</p>
          </div>
        </div>

        <!-- Detailed Findings -->
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            <span style="display: inline-block; width: 4px; height: 24px; background: #8b5cf6; border-radius: 2px;"></span>
            DETAILED FINDINGS
          </h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1e293b;">Detection Methodology</h3>
            <p style="margin: 0 0 8px 0; color: #475569; font-size: 12px;">
              <strong style="color: #1e293b;">1. Anomaly Detection:</strong> Machine learning algorithms identify transactions that deviate from normal spending patterns.
            </p>
            <p style="margin: 0 0 8px 0; color: #475569; font-size: 12px;">
              <strong style="color: #1e293b;">2. Benford's Law Analysis:</strong> Validates first digit distribution of transaction amounts against expected probability distributions.
            </p>
            <p style="margin: 0; color: #475569; font-size: 12px;">
              <strong style="color: #1e293b;">3. Vendor Similarity Matching:</strong> Detects suspicious vendor name variations and duplicate vendors using fuzzy matching algorithms.
            </p>
          </div>
        </div>

        <!-- Risk Breakdown -->
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            <span style="display: inline-block; width: 4px; height: 24px; background: #8b5cf6; border-radius: 2px;"></span>
            RISK CLASSIFICATION
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #1e293b; color: white;">
                <th style="padding: 12px; text-align: left; font-weight: 700;">Risk Category</th>
                <th style="padding: 12px; text-align: center; font-weight: 700;">Count</th>
                <th style="padding: 12px; text-align: right; font-weight: 700;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; color: #1e293b;"><strong>High Risk Transactions</strong></td>
                <td style="padding: 12px; text-align: center; color: #dc2626; font-weight: 700;">${flaggedRecords}</td>
                <td style="padding: 12px; text-align: right; color: #dc2626; font-weight: 700;">${flaggedPct}%</td>
              </tr>
              <tr style="background: white; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; color: #1e293b;"><strong>Normal Transactions</strong></td>
                <td style="padding: 12px; text-align: center; color: #22c55e; font-weight: 700;">${(totalRecords - flaggedRecords).toLocaleString('en-US')}</td>
                <td style="padding: 12px; text-align: right; color: #22c55e; font-weight: 700;">${(100 - flaggedPct).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recommendations -->
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            <span style="display: inline-block; width: 4px; height: 24px; background: #8b5cf6; border-radius: 2px;"></span>
            RECOMMENDATIONS
          </h2>
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0284c7;">
            <ul style="margin: 0; padding-left: 20px; color: #1e293b; font-size: 12px; line-height: 1.8;">
              <li>Immediately investigate all <strong>${flaggedRecords} high-risk transactions</strong> with dedicated audit teams.</li>
              <li>Review vendor master data for <strong>${fuzzyMatches} duplicate vendor alerts</strong> to prevent fraud.</li>
              <li>Conduct deeper analysis on transactions with <strong>Benford's Law deviation (${benfordRisk}%)</strong> risk level.</li>
              <li>Implement additional controls for transactions exceeding statistical norms.</li>
              <li>Schedule follow-up audit within 30 days to track remediation progress.</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
            This report is confidential and intended for authorized personnel only.
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            Generated by LedgerSpy Fraud Detection System • © ${currentDate.getFullYear()} • All Rights Reserved
          </p>
        </div>
      </div>
    `

    const opt = {
      margin: 15,
      filename: `Audit-Report-${results?.file_id || 'export'}-${currentDate.getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    }

    html2pdf().set(opt).from(element).save()
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
            Download PDF
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
