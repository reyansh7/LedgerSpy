import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function ExplainableAIPanel({ anomalies }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = anomalies?.[selectedIdx]

  if (!anomalies?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-50 mb-4">🧠 Explainable AI Panel</h3>
      <p className="text-sm text-slate-400 mb-6">
        Understand WHY each transaction was flagged as suspicious
      </p>

      {/* Transaction Selector */}
      <div className="mb-6 space-y-3">
        <label className="text-sm font-semibold text-slate-300">Select Transaction to Analyze:</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {anomalies.slice(0, 10).map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`p-3 rounded-lg text-left text-xs font-mono transition-all ${
                selectedIdx === idx
                  ? 'bg-purple-500/30 border border-purple-400 text-purple-200'
                  : 'bg-slate-800/30 border border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">{item.transaction_id}</div>
              <div className="text-purple-300">₹{(item.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div>Risk: {item.risk_score.toFixed(1)}</div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <motion.div
          key={selectedIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Transaction Header */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400">Transaction ID</p>
                <p className="text-lg font-mono font-bold text-cyan-300">{selected.transaction_id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Amount</p>
                <p className="text-lg font-bold text-slate-200">₹{(selected.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Risk Score</p>
                <p className="text-lg font-bold text-red-300">{selected.risk_score.toFixed(1)} / 100</p>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-100">Why This Transaction Was Flagged:</h4>
            <div className="space-y-2">
              {selected.explanation?.map((exp, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-3 p-3 rounded-lg bg-slate-800/30 border-l-4 border-red-500/50"
                >
                  <span className="text-red-400 text-lg">•</span>
                  <span className="text-slate-300 text-sm">{exp}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-700/50">
            <h4 className="font-semibold text-slate-100 mb-2">💡 Recommended Action:</h4>
            <p className="text-sm text-slate-300">
              {selected.risk_score >= 80
                ? '🔴 HIGH PRIORITY: Manual review required. Consider blocking this transaction pending investigation.'
                : selected.risk_score >= 60
                ? '⚠️ MEDIUM PRIORITY: Flag for secondary review. Verify vendor details and transaction purpose.'
                : '🔵 LOW PRIORITY: Monitor similar patterns. Update fraud detection model if confirmed legitimate.'}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
