import React, { useState } from 'react'
import { motion } from 'framer-motion'
import RiskBadge from './RiskBadge'

export default function DataTable({ rows }) {
  const [sortConfig, setSortConfig] = useState({ key: 'risk_score', direction: 'desc' })

  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/40 to-slate-800/20 p-8 text-center">
        <p className="text-sm text-slate-400">✓ No transactions available.</p>
      </div>
    )
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aVal = a[sortConfig.key]
    const bVal = b[sortConfig.key]
    
    if (typeof aVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
    }
    return sortConfig.direction === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="overflow-x-auto rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/40 to-slate-800/20 backdrop-blur-sm"
    >
      <table className="w-full text-sm text-slate-200">
        <thead className="sticky top-0 bg-slate-800/40 text-xs font-semibold uppercase tracking-widest text-slate-300">
          <tr className="border-b border-slate-800/50">
            <th className="px-5 py-4 text-left font-semibold">
              <button
                onClick={() => handleSort('transaction_id')}
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
              >
                Transaction
                {sortConfig.key === 'transaction_id' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </th>
            <th className="px-5 py-4 text-left font-semibold">
              <button
                onClick={() => handleSort('timestamp')}
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
              >
                Timestamp
                {sortConfig.key === 'timestamp' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </th>
            <th className="px-5 py-4 text-left font-semibold">Vendor</th>
            <th className="px-5 py-4 text-left font-semibold">
              <button
                onClick={() => handleSort('amount')}
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
              >
                Amount
                {sortConfig.key === 'amount' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </th>
            <th className="px-5 py-4 text-left font-semibold">
              <button
                onClick={() => handleSort('risk_score')}
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
              >
                Risk
                {sortConfig.key === 'risk_score' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </th>
            <th className="px-5 py-4 text-left font-semibold">Primary Flag Reason</th>
            <th className="px-5 py-4 text-left font-semibold">Explanation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30">
          {sortedRows.map((row, idx) => (
            <motion.tr
              key={row.transaction_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="group border-slate-800/30 transition-all hover:bg-slate-800/20"
            >
              <td className="px-5 py-4 font-mono font-medium text-cyan-300 group-hover:text-cyan-200">
                {row.transaction_id}
              </td>
              <td className="px-5 py-4 text-slate-300 text-xs">
                {row.timestamp ? new Date(row.timestamp).toLocaleString() : '-'}
              </td>
              <td className="px-5 py-4 text-slate-300 max-w-xs truncate group-hover:text-slate-100" title={row.destination_entity}>
                {row.destination_entity}
              </td>
              <td className="px-5 py-4 text-slate-300 font-mono">
                ₹{typeof row.amount === 'number' ? row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : row.amount}
              </td>
              <td className="px-5 py-4">
                <RiskBadge score={row.risk_score} />
              </td>
              <td className="px-5 py-4 text-slate-300 text-xs max-w-xs truncate group-hover:text-slate-200" title={row.primary_reason}>
                {row.primary_reason || 'N/A'}
              </td>
              <td className="px-5 py-4 text-slate-400 text-xs max-w-md truncate group-hover:text-slate-200" title={row.explanation?.join(' ')}>
                {row.explanation?.join(' ') || 'N/A'}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}
