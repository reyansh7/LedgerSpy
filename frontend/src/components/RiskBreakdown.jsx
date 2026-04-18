import React from 'react'
import { motion } from 'framer-motion'

export default function RiskBreakdown({ anomalies, benfordRisk, fuzzyMatchCount }) {
  // Calculate average risk breakdown across all anomalies
  const avgAnomalyScore = anomalies?.length ? (anomalies.reduce((sum, a) => sum + (a.is_anomaly ? 50 : 0), 0) / anomalies.length) : 0
  const vendorScore = (fuzzyMatchCount / Math.max(anomalies?.length || 1, 1)) * 30
  const benfordScore = Math.min((benfordRisk || 0), 100) * 0.2

  const components = [
    {
      name: 'Anomaly Detection (Isolation Forest)',
      percentage: Math.round(avgAnomalyScore),
      color: 'from-blue-500 to-blue-600',
      border: 'border-blue-500/30',
      description: 'Detects unusual transaction patterns and outliers',
    },
    {
      name: 'Vendor Match Analysis',
      percentage: Math.round(vendorScore),
      color: 'from-red-500 to-red-600',
      border: 'border-red-500/30',
      description: 'Identifies suspicious vendor duplicate/similarity',
    },
    {
      name: "Benford's Law Deviation",
      percentage: Math.round(benfordScore),
      color: 'from-amber-500 to-amber-600',
      border: 'border-amber-500/30',
      description: 'Checks first-digit distribution anomalies',
    },
  ]

  const totalRisk = components.reduce((sum, c) => sum + c.percentage, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/40 to-slate-800/20 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-50 mb-2">📊 Explainable Risk Breakdown</h3>
      <p className="text-sm text-slate-400 mb-6">How we calculate fraud risk for each transaction</p>

      <div className="space-y-6">
        {components.map((comp, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-lg border ${comp.border} bg-slate-800/30`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-100">{comp.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{comp.description}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-50">{comp.percentage}%</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-700/30 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${comp.percentage}%` }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 1 }}
                className={`h-2.5 rounded-full bg-gradient-to-r ${comp.color}`}
              />
            </div>

            {/* Contribution */}
            <p className="text-xs text-slate-400 mt-2">
              Weight: {comp.name.includes('Anomaly') ? '50%' : comp.name.includes('Vendor') ? '30%' : '20%'} of total risk
            </p>
          </motion.div>
        ))}
      </div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-2">COMBINED RISK FACTORS</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Anomaly Detection:</span>
                <span className="text-blue-300 font-semibold">50% weight</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Vendor Matching:</span>
                <span className="text-red-300 font-semibold">30% weight</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Benford's Law:</span>
                <span className="text-amber-300 font-semibold">20% weight</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Average Transaction Risk</p>
              <div className="text-5xl font-bold text-slate-50">
                {((components.reduce((sum, c) => sum + c.percentage, 0) / components.length) || 0).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
