import React from 'react'
import FileUpload from '../components/FileUpload'
import { motion } from 'framer-motion'

export default function Upload() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-4xl space-y-6 p-6"
    >
      <h1 className="text-3xl font-bold tracking-tight text-slate-100">Upload Financial Ledger</h1>
      <p className="max-w-2xl text-slate-300">
        Submit a transaction CSV and LedgerSpy will run anomaly detection, Benford analysis, and vendor fuzzy matching in one pass.
      </p>
      <FileUpload />
      
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-lg font-semibold text-slate-100">Upload Requirements</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
          <li>Format: CSV (.csv)</li>
          <li>Must include amount and timestamp/date columns</li>
          <li>Vendor column can be named destination_entity, vendor, vendor_name, merchant, payee, or description</li>
        </ul>

        <h3 className="mt-4 text-lg font-semibold text-slate-100">Output</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
          <li>Per-transaction risk score and explanation</li>
          <li>Benford distribution comparison and compliance result</li>
          <li>Potential ghost vendors detected through RapidFuzz similarity</li>
        </ul>
      </div>
    </motion.div>
  )
}
