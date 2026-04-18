import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function VendorSimilarityDetection({ fuzzyMatches }) {
  const [expanded, setExpanded] = useState(null)

  if (!fuzzyMatches?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6"
      >
        <h3 className="text-lg font-semibold text-slate-50 mb-2">🔗 Vendor Similarity Detection</h3>
        <p className="text-sm text-emerald-300">✓ No suspicious vendor duplicates detected</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-50 mb-4">🔗 Vendor Similarity Detection</h3>
      <p className="text-sm text-slate-400 mb-6">
        Detected {fuzzyMatches.length} suspicious vendor pairs. These may indicate fraud attempts or data entry errors.
      </p>

      <div className="space-y-3">
        {fuzzyMatches.map((match, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="border border-red-500/20 rounded-lg p-4 bg-slate-800/20 hover:bg-slate-800/40 transition-all cursor-pointer"
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">{match.vendor_1}</p>
                <div className="flex items-center gap-2 my-2 text-xs text-slate-400">
                  <span>↔</span>
                  <span>Similarity Score</span>
                </div>
                <p className="text-sm font-semibold text-slate-200">{match.vendor_2}</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <span className="text-2xl font-bold text-red-300">{match.risk_score}%</span>
                  <span className="text-xs text-red-300">Match</span>
                </div>
                <p className="text-xs text-red-400 mt-2">
                  {match.risk_score >= 90 ? '🚨 Very High Risk' :
                   match.risk_score >= 80 ? '⚠️ High Risk' :
                   '⚡ Medium Risk'}
                </p>
              </div>
            </div>

            {expanded === idx && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-slate-700/50"
              >
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300">
                    <span className="font-semibold">💡 Assessment:</span> Possible duplicate vendor (typo or intentional obfuscation)
                  </p>
                  <p className="text-slate-400">
                    Consider consolidating vendor records or investigating for fraudulent activity.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
