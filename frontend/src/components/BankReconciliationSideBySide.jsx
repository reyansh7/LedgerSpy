import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Side-by-Side Bank Reconciliation Visualizer
 * Shows ledger transactions on left, bank statements on right
 * with visual connections for matched transactions
 */

export default function BankReconciliationSideBySide({ reconciliationResults }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  
  if (!reconciliationResults?.results) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
      }}>
        <p>No reconciliation data available</p>
      </div>
    )
  }

  const transactions = reconciliationResults.results

  // Separate transactions by status
  const matchedTxns = transactions.filter(t => t.status === 'MATCHED')
  const partialTxns = transactions.filter(t => t.status === 'PARTIAL')
  const missingTxns = transactions.filter(t => t.status === 'MISSING')

  // Calculate positions for drawing connector lines
  const getTxnY = (txnArray, index) => {
    return 60 + (index * 80) // 60px padding + 80px per row
  }

  const getConnectorPath = (ledgerIndex, bankIndex, status) => {
    const startY = getTxnY(transactions, ledgerIndex)
    const endY = getTxnY(transactions, bankIndex)
    
    // Create a smooth bezier curve
    const midX = 450 // middle of the 900px width
    return `M 320,${startY + 25} C ${midX},${startY + 25} ${midX},${endY + 25} 580,${endY + 25}`
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'MATCHED': return '#22c55e'
      case 'PARTIAL': return '#f59e0b'
      case 'MISSING': return '#ef4444'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'MATCHED': return '✅ Matched'
      case 'PARTIAL': return '⚠️ Partial'
      case 'MISSING': return '❌ Missing'
      default: return status
    }
  }

  const TransactionCard = ({ txn, type, isHovered, onHover }) => {
    const bgColor = type === 'ledger' 
      ? 'rgba(59, 130, 246, 0.1)' 
      : 'rgba(139, 92, 246, 0.1)'
    
    const borderColor = type === 'ledger'
      ? isHovered ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.2)'
      : isHovered ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.2)'

    const amount = type === 'ledger' ? txn.ledger_amount : txn.bank_amount
    const vendor = type === 'ledger' ? txn.ledger_vendor : txn.bank_vendor
    const txnId = type === 'ledger' ? txn.id : txn.bank_txn_id

    return (
      <motion.div
        onMouseEnter={() => onHover(txn.id)}
        onMouseLeave={() => onHover(null)}
        whileHover={{ scale: 1.02, x: type === 'ledger' ? -5 : 5 }}
        style={{
          background: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '8px',
          cursor: 'pointer',
          transition: 'all 300ms ease',
          minHeight: '70px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          {type === 'ledger' ? '📋 LEDGER' : '🏦 BANK'}
        </div>
        
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: '4px' }}>
          {txnId ? `${txnId}`.substring(0, 16) : 'N/A'}
        </div>
        
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {vendor || 'Unknown'}
        </div>
        
        <div style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: '#3b82f6',
          fontFamily: "'JetBrains Mono', monospace",
          marginTop: '6px',
        }}>
          ₹{amount ? amount.toFixed(2) : 'N/A'}
        </div>
      </motion.div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '24px',
    }}>
      {/* Header Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '12px',
      }}>
        {[
          { label: '✅ Matched', count: matchedTxns.length, color: '#22c55e' },
          { label: '⚠️ Partial', count: partialTxns.length, color: '#f59e0b' },
          { label: '❌ Missing', count: missingTxns.length, color: '#ef4444' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
              border: `1px solid ${stat.color}40`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>
              {stat.count}
            </div>
          </div>
        ))}
      </div>

      {/* Main Side-by-Side View */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        background: 'linear-gradient(135deg, rgba(18, 22, 38, 0.7), rgba(27, 27, 47, 0.4))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '28px',
        backdropFilter: 'blur(16px)',
        minHeight: '600px',
        position: 'relative',
      }}>
        {/* Left Column: LEDGER */}
        <div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#3b82f6',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>📋 LEDGER TRANSACTIONS</span>
            <span style={{
              fontSize: '0.8rem',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600,
            }}>
              {transactions.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transactions.map((txn, idx) => (
              <TransactionCard
                key={txn.id}
                txn={txn}
                type="ledger"
                isHovered={hoveredId === txn.id}
                onHover={setHoveredId}
              />
            ))}
          </div>
        </div>

        {/* Middle: Connection Lines & Status */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translateX(-50%) translateY(-50%)',
          width: '2px',
          height: '80%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Right Column: BANK */}
        <div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#8b5cf6',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>🏦 BANK STATEMENT</span>
            <span style={{
              fontSize: '0.8rem',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#8b5cf6',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600,
            }}>
              {transactions.filter(t => t.bank_amount !== null).length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transactions.map((txn, idx) => (
              txn.bank_amount !== null && (
                <TransactionCard
                  key={`${txn.id}-bank`}
                  txn={txn}
                  type="bank"
                  isHovered={hoveredId === txn.id}
                  onHover={setHoveredId}
                />
              )
            ))}
          </div>
        </div>
      </div>

      {/* Matching Summary Table */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(18, 22, 38, 0.7), rgba(27, 27, 47, 0.4))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '24px',
        backdropFilter: 'blur(16px)',
        overflow: 'auto',
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '16px',
        }}>
          📊 Detailed Reconciliation
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.85rem',
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              <th style={{ textAlign: 'left', padding: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                Ledger ID
              </th>
              <th style={{ textAlign: 'left', padding: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                Ledger Amt
              </th>
              <th style={{ textAlign: 'left', padding: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                Bank ID
              </th>
              <th style={{ textAlign: 'left', padding: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                Bank Amt
              </th>
              <th style={{ textAlign: 'left', padding: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                Status
              </th>
              <th style={{ textAlign: 'left', padding: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 10).map((txn, idx) => (
              <motion.tr
                key={txn.id}
                onMouseEnter={() => setHoveredId(txn.id)}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                }}
              >
                <td style={{ padding: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  {txn.id ? `${txn.id}`.substring(0, 12) : 'N/A'}
                </td>
                <td style={{ padding: '12px', color: '#3b82f6', fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>
                  ₹{txn.ledger_amount?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  {txn.bank_txn_id ? `${txn.bank_txn_id}`.substring(0, 12) : '-'}
                </td>
                <td style={{ padding: '12px', color: '#8b5cf6', fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>
                  {txn.bank_amount ? `₹${txn.bank_amount.toFixed(2)}` : '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: `${getStatusColor(txn.status)}20`,
                    color: getStatusColor(txn.status),
                    textTransform: 'uppercase',
                  }}>
                    {getStatusLabel(txn.status)}
                  </span>
                </td>
                <td style={{
                  padding: '12px',
                  color: txn.amount_diff_pct > 5 ? '#ef4444' : 'rgba(255,255,255,0.7)',
                  fontFamily: "'JetBrains Mono'",
                }}>
                  {txn.amount_diff_pct ? `${txn.amount_diff_pct.toFixed(2)}%` : '-'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {transactions.length > 10 && (
          <div style={{
            marginTop: '12px',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
          }}>
            Showing 10 of {transactions.length} transactions
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginTop: '12px',
      }}>
        {[
          { icon: '✅', label: 'Matched', desc: 'Found in both ledger and bank' },
          { icon: '⚠️', label: 'Partial', desc: 'Found but amount differs slightly' },
          { icon: '❌', label: 'Missing', desc: 'Ledger entry not in bank statement' },
        ].map(item => (
          <div
            key={item.label}
            style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{item.icon}</div>
            <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>
              {item.label}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
