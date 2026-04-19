import React, { useState } from 'react'
import { motion } from 'framer-motion'

const GlassCard = ({ children, style }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, rgba(18, 22, 38, 0.7), rgba(27, 27, 47, 0.4))',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '20px',
      padding: '28px',
      backdropFilter: 'blur(16px)',
      transition: 'all 300ms ease',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    {children}
  </div>
)

export default function BankReconciliation({ anomalies, totalRecords, reconciliationResults }) {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('id')
  
  // If reconciliation results are provided, use those; otherwise use defaults
  let matchedCount, missingCount, partialCount, matchPercentage, ledgerTotal, bankTotal
  let transactions = []
  
  if (reconciliationResults?.summary) {
    // Use actual reconciliation data if provided
    matchedCount = reconciliationResults.summary.matched || 0
    partialCount = reconciliationResults.summary.partial_match || 0
    missingCount = reconciliationResults.summary.missing_or_extra || 0
    ledgerTotal = reconciliationResults.summary.total_transactions || 0
    bankTotal = ledgerTotal - missingCount // Bank statement has 5% fewer rows
    matchPercentage = reconciliationResults.summary.reconciliation_rate || 0
    transactions = reconciliationResults.results || []
  } else {
    // Default realistic simulation: 5% missing, 3% partial, 92% matched
    ledgerTotal = totalRecords || 10000
    missingCount = Math.floor(ledgerTotal * 0.05) // 5% missing rows
    partialCount = Math.floor(ledgerTotal * 0.03) // 3% amount mismatches
    matchedCount = ledgerTotal - missingCount - partialCount // ~92% matched
    bankTotal = ledgerTotal - missingCount // Bank has the missing rows removed
    matchPercentage = ((matchedCount / ledgerTotal) * 100).toFixed(1)
  }
  
  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    let statusMatch = true
    if (filter === 'matched') statusMatch = t.status === 'MATCHED'
    if (filter === 'partial') statusMatch = t.status === 'PARTIAL'
    if (filter === 'missing') statusMatch = t.status === 'MISSING' || t.status === 'MISSING'
    
    let searchMatch = true
    if (searchTerm) {
      searchMatch =
        (t.id?.toString().includes(searchTerm)) ||
        (t.transaction_id?.toString().includes(searchTerm)) ||
        (t.ledger_vendor?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.bank_vendor?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.bank_txn_id?.toString().includes(searchTerm))
    }
    
    return statusMatch && searchMatch
  })
  
  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'id') return (a.id || a.transaction_id) > (b.id || b.transaction_id) ? 1 : -1
    if (sortBy === 'amount') return (a.ledger_amount || 0) - (b.ledger_amount || 0)
    if (sortBy === 'status') return a.status.localeCompare(b.status)
    return 0
  })
  
  const getStatusBadge = (status) => {
    const statusMap = {
      'MATCHED': { label: 'Matched', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
      'PARTIAL': { label: 'Partial Match', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
      'MISSING': { label: 'Missing', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
    }
    const s = statusMap[status] || { label: status, color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' }
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 700,
        backgroundColor: s.bgColor,
        color: s.color,
        textTransform: 'uppercase',
      }}>
        {s.label}
      </span>
    )
  }
  
  // Calculate percentages
  const matchedPct = ledgerTotal ? ((matchedCount / ledgerTotal) * 100).toFixed(1) : 0
  const partialPct = ledgerTotal ? ((partialCount / ledgerTotal) * 100).toFixed(1) : 0
  const missingPct = ledgerTotal ? ((missingCount / ledgerTotal) * 100).toFixed(1) : 0

  const reconciliationData = [
    {
      status: 'Matched',
      count: matchedCount,
      percentage: matchedPct,
      icon: '✅',
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.03))',
      border: 'rgba(34, 197, 94, 0.2)',
      barGradient: 'linear-gradient(90deg, #22c55e, #4ade80)',
      description: 'Successfully reconciled with bank records',
      iconSvg: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      status: 'Missing',
      count: missingCount,
      percentage: missingPct,
      icon: '❌',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.03))',
      border: 'rgba(239, 68, 68, 0.2)',
      barGradient: 'linear-gradient(90deg, #ef4444, #f87171)',
      description: 'No matching bank record found',
      iconSvg: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      status: 'Partial Match',
      count: partialCount,
      percentage: partialPct,
      icon: '⚠️',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.03))',
      border: 'rgba(245, 158, 11, 0.2)',
      barGradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      description: 'Amount or date mismatch detected',
      iconSvg: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ]

  return (
    <GlassCard>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #22c55e, #3b82f6)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>
            🏦
          </div>
          <div>
            <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #fff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Bank Reconciliation Status
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>Transaction matching against bank records</p>
          </div>
        </div>

        {/* Match rate badge */}
        <div style={{
          padding: '8px 16px',
          borderRadius: '12px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
            Match Rate
          </span>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            fontFamily: "'Poppins', sans-serif",
            color: '#4ade80',
          }}>
            {matchPercentage}%
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px',
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Ledger Column */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '0.7rem',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            fontWeight: 600,
            margin: '0 0 12px 0',
          }}>
            📊 Ledger Dataset
          </p>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            fontFamily: "'Poppins', sans-serif",
            color: '#60a5fa',
            marginBottom: '4px',
          }}>
            {ledgerTotal.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: 0 }}>Total transactions</p>
        </div>

        {/* Bank Statement Column */}
        <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{
            fontSize: '0.7rem',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            fontWeight: 600,
            margin: '0 0 12px 0',
          }}>
            🏦 Bank Statement
          </p>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            fontFamily: "'Poppins', sans-serif",
            color: '#22c55e',
            marginBottom: '4px',
          }}>
            {bankTotal.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: 0 }}>Received transactions</p>
        </div>
      </motion.div>

      {/* Difference Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 6px 0' }}>
          Difference
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#ef4444',
            fontFamily: "'Poppins', sans-serif",
          }}>
            {missingCount.toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
            ({missingPct}%) missing from bank statement
          </span>
        </div>
      </motion.div>

      {/* Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {reconciliationData.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              padding: '20px',
              borderRadius: '14px',
              background: item.gradient,
              border: `1px solid ${item.border}`,
              transition: 'all 250ms ease',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${item.color}50`
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = `0 8px 24px ${item.color}15`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${item.color}35`
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: `${item.color}15`,
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.iconSvg}
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {item.status}
              </span>
            </div>
            <p style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: "'Poppins', sans-serif",
              color: '#fff',
              margin: '0 0 2px 0',
              lineHeight: 1,
            }}>
              {item.count.toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize: '0.72rem', color: item.color, fontWeight: 600, margin: '0 0 4px 0' }}>
              {item.percentage}% of total
            </p>
            <p style={{ fontSize: '0.68rem', color: '#6B7280', margin: 0 }}>{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress Bars Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          padding: '20px',
          borderRadius: '14px',
          background: 'rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '16px',
        }}
      >
        <p style={{
          fontSize: '0.7rem',
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
          margin: '0 0 16px 0',
        }}>
          Reconciliation Breakdown
        </p>

        {/* Stacked bar */}
        <div style={{
          display: 'flex',
          width: '100%',
          height: '24px',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px',
          background: 'rgba(255,255,255,0.04)',
        }}>
          {reconciliationData.map((item, idx) => {
            const width = totalRecords ? (item.count / totalRecords) * 100 : 0
            return (
              <motion.div
                key={idx}
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ delay: 0.5 + idx * 0.15, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  height: '100%',
                  background: item.barGradient,
                  position: 'relative',
                  minWidth: width > 0 ? '2px' : 0,
                }}
                title={`${item.status}: ${item.count} (${item.percentage}%)`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {reconciliationData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                background: item.barGradient,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{item.status}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E5E7EB' }}>{item.count.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Table Section */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            marginBottom: '20px',
            borderRadius: '14px',
            background: 'rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#E5E7EB',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              📋 Detailed Reconciliation Data
            </p>

            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '12px',
            }}>
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search by ID, vendor, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: '1 1 250px',
                  minWidth: '200px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#E5E7EB',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />

              {/* Filter Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'matched', 'partial', 'missing'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: filter === f ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.3)',
                      color: filter === f ? '#4ade80' : '#9CA3AF',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (filter !== f) {
                        e.target.style.borderColor = 'rgba(255,255,255,0.15)'
                        e.target.style.background = 'rgba(0,0,0,0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== f) {
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                        e.target.style.background = 'rgba(0,0,0,0.3)'
                      }
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#E5E7EB',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="id">Sort: ID</option>
                <option value="amount">Sort: Amount</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>

            <p style={{
              fontSize: '0.7rem',
              color: '#6B7280',
              margin: '0',
            }}>
              Showing {sortedTransactions.length} of {transactions.length} transactions
            </p>
          </div>

          {/* Scrollable Table */}
          <div style={{
            overflowX: 'auto',
            maxHeight: '600px',
            overflowY: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.75rem',
            }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: 'rgba(0,0,0,0.4)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                <tr>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Ledger ID</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Ledger Amt</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Ledger Vendor</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Bank ID</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Bank Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Bank Amt</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Bank Vendor</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', fontSize: '0.65rem' }}>Diff %</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.length > 0 ? (
                  sortedTransactions.map((txn, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: txn.status === 'MATCHED' ? 'transparent' : txn.status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        transition: 'background 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = txn.status === 'MATCHED' ? 'rgba(255,255,255,0.03)' : txn.status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = txn.status === 'MATCHED' ? 'transparent' : txn.status === 'PARTIAL' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}>{getStatusBadge(txn.status)}</td>
                      <td style={{ padding: '12px 14px', color: '#E5E7EB', fontFamily: 'monospace' }}>{txn.id || txn.transaction_id}</td>
                      <td style={{ padding: '12px 14px', color: '#9CA3AF' }}>{txn.date?.split('T')[0] || txn.ledger_date?.split('T')[0] || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>₹{txn.ledger_amount?.toFixed(2) || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#9CA3AF', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.ledger_vendor || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#E5E7EB', fontFamily: 'monospace' }}>{txn.bank_txn_id || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#9CA3AF' }}>{txn.bank_date?.split('T')[0] || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: txn.bank_amount ? '#22c55e' : '#6B7280', fontWeight: 600 }}>{txn.bank_amount ? `₹${txn.bank_amount.toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#9CA3AF', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.bank_vendor || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: txn.amount_diff_pct ? (txn.amount_diff_pct > 5 ? '#ef4444' : '#f59e0b') : '#6B7280', fontWeight: 600 }}>{txn.amount_diff_pct ? `${txn.amount_diff_pct.toFixed(2)}%` : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280' }}>
                      No transactions found matching your filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ade80', margin: 0 }}>
            Reconciliation Status: READY
          </p>
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0 0' }}>
            {matchPercentage}% transactions successfully matched with bank records
          </p>
        </div>
      </motion.div>
    </GlassCard>
  )
}
