import React from 'react'

export default function Loader() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400"></div>
      <p className="text-sm text-slate-300">Processing ledger data...</p>
    </div>
  )
}
