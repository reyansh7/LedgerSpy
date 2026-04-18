import React from 'react'
import { motion } from 'framer-motion'

export default function DataIntegrityDashboard({ readinessReport, totalRecords }) {
  const readinessScore = readinessReport?.readiness_score || 0
  const completeness = parseFloat(readinessReport?.completeness) || 0
  const dataQuality = readinessReport?.data_quality || 'Unknown'

  const qualityColor = 
    readinessScore >= 80 ? 'from-emerald-500/30 to-emerald-500/10' :
    readinessScore >= 60 ? 'from-amber-500/30 to-amber-500/10' :
    'from-red-500/30 to-red-500/10'

  const qualityBorder =
    readinessScore >= 80 ? 'border-emerald-500/50' :
    readinessScore >= 60 ? 'border-amber-500/50' :
    'border-red-500/50'

  const qualityText =
    readinessScore >= 80 ? 'text-emerald-300' :
    readinessScore >= 60 ? 'text-amber-300' :
    'text-red-300'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${qualityBorder} bg-gradient-to-br ${qualityColor} p-6 backdrop-blur-xl`}
    >
      <h3 className="text-lg font-semibold text-slate-50 mb-6">📊 Data Integrity Dashboard</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Readiness Score */}
        <div className="space-y-2 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 uppercase">Readiness Score</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${qualityText}`}>{readinessScore.toFixed(1)}%</span>
            <span className="text-sm text-slate-400 mb-1">{dataQuality}</span>
          </div>
          <div className="w-full bg-slate-700/30 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${readinessScore}%` }}
              transition={{ delay: 0.2, duration: 1 }}
              className={`h-2 rounded-full ${
                readinessScore >= 80 ? 'bg-emerald-500' :
                readinessScore >= 60 ? 'bg-amber-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Completeness */}
        <div className="space-y-2 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 uppercase">Completeness</p>
          <p className="text-3xl font-bold text-cyan-300">{completeness.toFixed(1)}%</p>
          <p className="text-xs text-slate-400">of required fields</p>
        </div>

        {/* Total Records */}
        <div className="space-y-2 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Records</p>
          <p className="text-3xl font-bold text-blue-300">{(totalRecords || 0).toLocaleString()}</p>
          <p className="text-xs text-slate-400">transactions</p>
        </div>

        {/* Data Quality Metrics */}
        <div className="space-y-2 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 uppercase">Quality Metrics</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-300">✓ Timestamps: {readinessReport?.timestamp_validity || 'N/A'}</p>
            <p className="text-slate-300">✓ Amounts: {readinessReport?.amount_validity || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Quality Assessment */}
      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            readinessScore >= 80 ? 'bg-emerald-500' :
            readinessScore >= 60 ? 'bg-amber-500' :
            'bg-red-500'
          }`} />
          <div>
            <p className="font-semibold text-slate-100">
              {readinessScore >= 80 ? '✅ Data is audit-ready' :
               readinessScore >= 60 ? '⚠️ Data has some quality issues' :
               '🔴 Data requires review'}
            </p>
            <p className="text-sm text-slate-400">
              {readinessScore >= 80 ? 'All integrity checks passed. Safe to proceed with analysis.' :
               readinessScore >= 60 ? 'Some missing values detected. Consider data cleaning.' :
               'Significant data quality issues detected. Manual review recommended.'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
