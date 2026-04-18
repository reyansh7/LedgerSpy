import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function AuditReportGenerator({ results }) {
  const [copied, setCopied] = useState(false)

  const totalRecords = results?.summary?.total_records || 0
  const flaggedRecords = results?.summary?.flagged_records || 0
  const benfordRisk = results?.summary?.benford_risk || 0
  const fuzzyMatches = results?.summary?.fuzzy_match_count || 0

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
Suspicious Transactions: ${flaggedRecords} (${((flaggedRecords / totalRecords) * 100).toFixed(2)}%)
Benford's Law Risk: ${benfordRisk}%
Duplicate Vendor Alerts: ${fuzzyMatches}

KEY FINDINGS
${'─'.repeat(60)}

1. ANOMALY DETECTION
   • ${flaggedRecords} transactions flagged by Isolation Forest algorithm
   • Analysis identifies unusual patterns and statistical outliers
   • Represents ${((flaggedRecords / totalRecords) * 100).toFixed(2)}% of total transaction volume

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

TECHNICAL DETAILS
${'─'.repeat(60)}
Detection Methods:
- Isolation Forest (Anomaly Detection)
- Fuzzy String Matching (Vendor Similarity)
- Benford's Law Analysis (Digital Distribution)
- Statistical Profiling (Risk Scoring)

Confidence Level: High (Multi-factor analysis)

NEXT STEPS
${'─'.repeat(60)}
1. Internal audit team review
2. Management approval for follow-up
3. Document findings and corrective actions
4. Archive report for compliance records

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/40 to-slate-800/20 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-50">📝 Automated Audit Report</h3>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyToClipboard}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-all"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadReport}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all"
          >
            📥 Download
          </motion.button>
        </div>
      </div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-6 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 overflow-y-auto"
      >
        <pre className="whitespace-pre-wrap break-words">{report}</pre>
      </motion.div>

      {/* Key Metrics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs text-slate-400">Total Records</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{totalRecords.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs text-red-300">Flagged</p>
          <p className="text-xl font-bold text-red-300 mt-1">{flaggedRecords}</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-300">Benford Risk</p>
          <p className="text-xl font-bold text-amber-300 mt-1">{benfordRisk}%</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs text-red-300">Vendor Alerts</p>
          <p className="text-xl font-bold text-red-300 mt-1">{fuzzyMatches}</p>
        </div>
      </div>
    </motion.div>
  )
}
