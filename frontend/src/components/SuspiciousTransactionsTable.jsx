import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RiskBadge from './RiskBadge'

const ROWS_PER_PAGE = 15

export default function SuspiciousTransactionsTable({ anomalies }) {
  const [sortConfig, setSortConfig] = useState({ key: 'risk_score', direction: 'desc' })
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState(null)

  const counts = useMemo(() => {
    const all = anomalies.length
    const high = anomalies.filter(r => r.risk_score >= 70).length
    const medium = anomalies.filter(r => r.risk_score >= 40 && r.risk_score < 70).length
    const low = anomalies.filter(r => r.risk_score < 40).length
    return { all, high, medium, low }
  }, [anomalies])

  const sortedRows = useMemo(() => {
    return [...anomalies].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (typeof aVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }, [anomalies, sortConfig])

  const filteredRows = useMemo(() => {
    if (filter === 'all') return sortedRows
    return sortedRows.filter(row => {
      const score = row.risk_score
      if (filter === 'high') return score >= 70
      if (filter === 'medium') return score >= 40 && score < 70
      return score < 40
    })
  }, [sortedRows, filter])

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE)
  const paginatedRows = filteredRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc',
    })
    setPage(1)
  }

  const filterTabs = [
    { key: 'all', label: 'All', count: counts.all, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.35)' },
    { key: 'high', label: 'High Risk', count: counts.high, color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' },
    { key: 'medium', label: 'Medium', count: counts.medium, color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
    { key: 'low', label: 'Low', count: counts.low, color: '#4ade80', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.35)' },
  ]

  const SortIcon = ({ active, direction }) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '1px', marginLeft: '4px', opacity: active ? 1 : 0.3 }}>
      <svg width="8" height="5" viewBox="0 0 8 5" fill={active && direction === 'asc' ? 'currentColor' : '#475569'}>
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" fill={active && direction === 'desc' ? 'currentColor' : '#475569'}>
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {filterTabs.map(f => (
          <motion.button
            key={f.key}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setFilter(f.key); setPage(1) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '12px',
              border: `1px solid ${filter === f.key ? f.border : 'rgba(255,255,255,0.06)'}`,
              background: filter === f.key ? f.bg : 'rgba(255,255,255,0.03)',
              color: filter === f.key ? f.color : '#6B7280',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 250ms ease',
            }}
          >
            <span>{f.label}</span>
            <span style={{
              background: filter === f.key ? `${f.color}22` : 'rgba(255,255,255,0.06)',
              color: filter === f.key ? f.color : '#9CA3AF',
              padding: '2px 8px',
              borderRadius: '8px',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}>
              {f.count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Table container */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(135deg, rgba(18, 22, 38, 0.7), rgba(27, 27, 47, 0.4))',
          backdropFilter: 'blur(16px)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{
                background: 'rgba(0, 0, 0, 0.25)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <th style={thStyle}>
                  <button onClick={() => handleSort('timestamp')} style={thButtonStyle}>
                    Date <SortIcon active={sortConfig.key === 'timestamp'} direction={sortConfig.direction} />
                  </button>
                </th>
                <th style={thStyle}>Vendor</th>
                <th style={thStyle}>
                  <button onClick={() => handleSort('amount')} style={thButtonStyle}>
                    Amount <SortIcon active={sortConfig.key === 'amount'} direction={sortConfig.direction} />
                  </button>
                </th>
                <th style={thStyle}>
                  <button onClick={() => handleSort('risk_score')} style={thButtonStyle}>
                    Risk Score <SortIcon active={sortConfig.key === 'risk_score'} direction={sortConfig.direction} />
                  </button>
                </th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Reason</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {paginatedRows.map((row, idx) => {
                  const isHigh = row.risk_score >= 70
                  const isCritical = row.risk_score >= 80
                  const isExpanded = expandedRow === row.transaction_id

                  return (
                    <React.Fragment key={row.transaction_id || idx}>
                      <motion.tr
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.015, duration: 0.2 }}
                        onClick={() => setExpandedRow(isExpanded ? null : row.transaction_id)}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                          borderLeft: isHigh ? `3px solid ${isCritical ? '#ef4444' : '#f59e0b'}` : '3px solid transparent',
                          background: isExpanded ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {row.timestamp ? new Date(row.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          }) : '-'}
                        </td>
                        <td style={{ ...tdStyle, maxWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.1))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#a78bfa',
                            }}>
                              {(row.destination_entity || '?')[0].toUpperCase()}
                            </div>
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#E5E7EB',
                              fontSize: '0.82rem',
                            }}>
                              {row.destination_entity}
                            </span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontWeight: 600, color: '#E5E7EB' }}>
                          ₹{typeof row.amount === 'number' ? row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : row.amount}
                        </td>
                        <td style={tdStyle}>
                          <RiskBadge score={row.risk_score} />
                        </td>
                        <td style={tdStyle}>
                          <StatusPill score={row.risk_score} />
                        </td>
                        <td style={{ ...tdStyle, maxWidth: '280px' }}>
                          <span style={{
                            color: '#9CA3AF',
                            fontSize: '0.78rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {row.explanation?.[0] || 'Multiple risk factors detected'}
                          </span>
                        </td>
                      </motion.tr>
                      {/* Expanded detail row */}
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan={6} style={{ padding: '0 20px 16px 20px', background: 'rgba(139, 92, 246, 0.03)' }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '12px',
                              padding: '16px',
                              borderRadius: '12px',
                              background: 'rgba(0,0,0,0.15)',
                              border: '1px solid rgba(255,255,255,0.04)',
                            }}>
                              {row.explanation?.map((exp, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                  <span style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: '#a78bfa',
                                    marginTop: '6px',
                                    flexShrink: 0,
                                  }} />
                                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF', lineHeight: 1.5 }}>{exp}</span>
                                </div>
                              ))}
                              {(!row.explanation || row.explanation.length === 0) && (
                                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>No additional details available</span>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.15)',
          }}>
            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
              Showing {((page - 1) * ROWS_PER_PAGE) + 1}–{Math.min(page * ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length} transactions
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <PaginationBtn
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ‹
              </PaginationBtn>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <PaginationBtn
                    key={pageNum}
                    active={pageNum === page}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </PaginationBtn>
                )
              })}
              <PaginationBtn
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                ›
              </PaginationBtn>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function StatusPill({ score }) {
  let config
  if (score >= 70) {
    config = { label: 'HIGH', bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)', dot: '#ef4444' }
  } else if (score >= 40) {
    config = { label: 'MEDIUM', bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', dot: '#f59e0b' }
  } else {
    config = { label: 'LOW', bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)', dot: '#22c55e' }
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.5px',
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.border}`,
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: config.dot,
        boxShadow: `0 0 4px ${config.dot}`,
      }} />
      {config.label}
    </span>
  )
}

function PaginationBtn({ children, active, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: `1px solid ${active ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
        background: active ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
        color: active ? '#a78bfa' : disabled ? '#374151' : '#9CA3AF',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        transition: 'all 200ms ease',
      }}
    >
      {children}
    </button>
  )
}

const thStyle = {
  padding: '14px 20px',
  textAlign: 'left',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  whiteSpace: 'nowrap',
}

const thButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  background: 'none',
  border: 'none',
  color: '#6B7280',
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  cursor: 'pointer',
  padding: 0,
  whiteSpace: 'nowrap',
  transition: 'color 200ms ease',
}

const tdStyle = {
  padding: '14px 20px',
  color: '#E5E7EB',
  fontSize: '0.82rem',
}
