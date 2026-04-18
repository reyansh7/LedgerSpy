import React from 'react'
import { motion } from 'framer-motion'

export default function BankReconciliation({ anomalies, totalRecords }) {
  // Mock data for bank reconciliation
  const flaggedCount = anomalies?.length || 0
  const matchedCount = Math.max(0, totalRecords - flaggedCount - Math.floor(flaggedCount * 0.1))
  const missingCount = Math.floor(flaggedCount * 0.1)
  const partialCount = Math.floor(flaggedCount * 0.05)

  const reconciliationData = [
    {
      status: 'Matched',
      count: matchedCount,
      percentage: ((matchedCount / totalRecords) * 100).toFixed(1),
      icon: '✅',
      color: 'emerald',
      description: 'Successfully reconciled with bank records',
    },
    {
      status: 'Missing',
      count: missingCount,
      percentage: ((missingCount / totalRecords) * 100).toFixed(1),
      icon: '❌',
      color: 'red',
      description: 'No matching bank record found',
    },
    {
      status: 'Partial',
      count: partialCount,
      percentage: ((partialCount / totalRecords) * 100).toFixed(1),
      icon: '⚠️',
      color: 'amber',
      description: 'Amount or date mismatch',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/40 to-slate-800/20 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-50 mb-6">🏦 Bank Reconciliation Status</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {reconciliationData.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-lg border border-${item.color}-500/30 bg-${item.color}-500/10`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{item.icon}</span>
              <p className={`text-sm font-semibold text-${item.color}-300`}>{item.status}</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-50">{item.count.toLocaleString('en-IN')}</p>
              <p className={`text-sm text-${item.color}-300`}>{item.percentage}% of total</p>
              <p className="text-xs text-slate-400 mt-2">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50"
      >
        <h4 className="font-semibold text-slate-100 mb-4">Reconciliation Summary</h4>
        
        <div className="space-y-3">
          {reconciliationData.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{item.status}</span>
                <span className="font-semibold text-slate-100">{item.count}</span>
              </div>
              <div className="w-full bg-slate-700/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ delay: 0.4 + idx * 0.1, duration: 1 }}
                  className={`h-2 rounded-full bg-${item.color}-500`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Overall Status */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-semibold text-emerald-300">Reconciliation Status: READY</p>
              <p className="text-sm text-emerald-300/70">
                {((matchedCount / totalRecords) * 100).toFixed(1)}% transactions successfully matched with bank records
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
