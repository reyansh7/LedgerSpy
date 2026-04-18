import React from 'react'
import FileUpload from '../components/FileUpload'
import { motion } from 'framer-motion'

export default function Upload() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fade-in"
      style={{ maxWidth: '900px', margin: '0 auto' }}
    >
      <h1 style={{ color: 'var(--text-white)', marginBottom: '0.5rem' }}>Upload Financial Ledger</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px' }}>
        Submit a transaction CSV and LedgerSpy will run anomaly detection, Benford analysis, and vendor fuzzy matching in one pass.
      </p>
      
      <FileUpload />
      
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--text-white)', marginBottom: '1rem' }}>Upload Requirements</h3>
        <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Format: CSV (.csv)</li>
          <li>Must include amount and timestamp/date columns</li>
          <li>Vendor column can be named destination_entity, vendor, vendor_name, merchant, payee, or description</li>
        </ul>

        <h3 style={{ color: 'var(--text-white)', marginTop: '1.5rem', marginBottom: '1rem' }}>Output</h3>
        <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Per-transaction risk score and explanation</li>
          <li>Benford distribution comparison and compliance result</li>
          <li>Potential ghost vendors detected through RapidFuzz similarity</li>
        </ul>
      </div>
    </motion.div>
  )
}
