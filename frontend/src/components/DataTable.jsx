import React from 'react'
import RiskBadge from './RiskBadge'

export default function DataTable({ rows }) {
  if (!rows?.length) {
    return <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">No transactions available.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-slate-800/70 text-xs uppercase tracking-wide text-slate-300">
          <tr>
            <th className="px-4 py-3">Transaction</th>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Risk</th>
            <th className="px-4 py-3">Explanation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.transaction_id} className="border-t border-slate-800 align-top">
              <td className="px-4 py-3 font-medium text-slate-100">{row.transaction_id}</td>
              <td className="px-4 py-3 text-slate-300">{row.timestamp || '-'}</td>
              <td className="px-4 py-3 text-slate-300">{row.destination_entity}</td>
              <td className="px-4 py-3 text-slate-300">{row.amount.toLocaleString()}</td>
              <td className="px-4 py-3"><RiskBadge score={row.risk_score} /></td>
              <td className="px-4 py-3 text-slate-300">{row.explanation?.join(' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
