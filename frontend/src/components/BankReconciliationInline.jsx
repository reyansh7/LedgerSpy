import React, { useState } from 'react'
import { ChevronDown, Upload, CheckCircle, AlertCircle, AlertTriangle, Download, Loader } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import api from '../services/api'

const BankReconciliationInline = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [ledgerFile, setLedgerFile] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setLedgerFile(file)
      setError(null)
    }
  }

  const handleReconcile = async () => {
    if (!ledgerFile) {
      setError('Please upload a ledger file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', ledgerFile)

      const response = await api.post('/reconciliation/auto-reconcile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reconcile. Please try again.')
      console.error('Reconciliation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredResults = () => {
    if (!results?.results) return []

    let filtered = results.results

    if (filter !== 'all') {
      filtered = filtered.filter((item) => item.status.toLowerCase() === filter.toLowerCase())
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.id?.toLowerCase().includes(term) ||
          item.date?.toLowerCase().includes(term) ||
          item.ledger_vendor?.toLowerCase().includes(term) ||
          item.bank_vendor?.toLowerCase().includes(term)
      )
    }

    return filtered
  }

  const getRowBackgroundColor = (status) => {
    switch (status) {
      case 'MISSING':
        return 'rgba(239, 68, 68, 0.1)' // Red background for MISSING
      case 'PARTIAL':
        return 'rgba(245, 134, 11, 0.1)' // Yellow/Orange background for PARTIAL
      default:
        return 'transparent' // Default background for MATCHED
    }
  }

  const filteredData = getFilteredResults()
  const statusCounts = {
    matched: results?.results?.filter((r) => r.status === 'MATCHED').length || 0,
    missing: results?.results?.filter((r) => r.status === 'MISSING').length || 0,
    partial: results?.results?.filter((r) => r.status === 'PARTIAL').length || 0,
  }

  const matchRate = results?.results
    ? (
        (statusCounts.matched / results.results.length) *
        100
      ).toFixed(1)
    : 0

  const handleExportPDF = () => {
    if (!filteredData.length) return

    const element = document.createElement('div')
    element.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #1e293b;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #6366f1; padding-bottom: 20px;">
          <div>
            <h1 style="margin: 0; color: #6366f1; font-size: 28px; font-weight: 700;">BANK RECONCILIATION REPORT</h1>
            <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">LedgerSpy Financial Audit System</p>
          </div>
          <div style="text-align: right; font-size: 13px; color: #64748b;">
            <p style="margin: 0;">Report Generated: ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p style="margin: 5px 0 0 0;">Time: ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <!-- Summary Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 15px;">RECONCILIATION SUMMARY</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div style="padding: 15px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #15803d; font-weight: 600; text-transform: uppercase;">Matched Transactions</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #22c55e;">${statusCounts.matched}</p>
            </div>
            <div style="padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #991b1b; font-weight: 600; text-transform: uppercase;">Missing</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #ef4444;">${statusCounts.missing}</p>
            </div>
            <div style="padding: 15px; background: #fffbeb; border-left: 4px solid #f5860b; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase;">Partial Match</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #f5860b;">${statusCounts.partial}</p>
            </div>
            <div style="padding: 15px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #1e40af; font-weight: 600; text-transform: uppercase;">Match Rate</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #3b82f6;">${matchRate}%</p>
            </div>
          </div>
        </div>

        <!-- Details Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 15px;">TRANSACTION DETAILS</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: #475569; border: 1px solid #e2e8f0;">Transaction ID</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: #475569; border: 1px solid #e2e8f0;">Date</th>
                <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: #475569; border: 1px solid #e2e8f0;">Ledger Amount</th>
                <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: #475569; border: 1px solid #e2e8f0;">Bank Amount</th>
                <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: #475569; border: 1px solid #e2e8f0;">Difference</th>
                <th style="padding: 12px 8px; text-align: center; font-weight: 700; color: #475569; border: 1px solid #e2e8f0;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((item, idx) => {
                const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                const difference = item.bank_amount !== null && item.bank_amount !== undefined
                  ? item.ledger_amount - item.bank_amount
                  : item.ledger_amount
                let statusColor = '#22c55e'
                let statusBg = '#f0fdf4'
                if (item.status === 'MISSING') {
                  statusColor = '#ef4444'
                  statusBg = '#fef2f2'
                } else if (item.status === 'PARTIAL') {
                  statusColor = '#f5860b'
                  statusBg = '#fffbeb'
                }
                return `
                  <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">${item.id || '-'}</td>
                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">${item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                    <td style="padding: 10px 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 500;">₹${parseFloat(item.ledger_amount || 0).toFixed(2)}</td>
                    <td style="padding: 10px 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 500;">₹${parseFloat(item.bank_amount || 0).toFixed(2)}</td>
                    <td style="padding: 10px 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 500; color: ${difference !== 0 ? '#ef4444' : '#22c55e'};">₹${parseFloat(difference || 0).toFixed(2)}</td>
                    <td style="padding: 10px 8px; text-align: center; border: 1px solid #e2e8f0;">
                      <span style="display: inline-block; padding: 4px 8px; background: ${statusBg}; color: ${statusColor}; border-radius: 4px; font-weight: 600; font-size: 11px;">
                        ${item.status}
                      </span>
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
            This is an automatically generated report from LedgerSpy. 
            For questions or discrepancies, please contact your accounting department.
          </p>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #cbd5e1; text-align: center;">
            © ${new Date().getFullYear()} LedgerSpy. All rights reserved.
          </p>
        </div>
      </div>
    `

    const opt = {
      margin: 10,
      filename: `Bank-Reconciliation-${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
    }

    html2pdf().set(opt).from(element).save()
  }


  return (
    <div className="reconciliation-inline">
      {/* Header */}
      <div
        className="reconciliation-inline__header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <div className="reconciliation-inline__title-section">
          <h3 className="reconciliation-inline__title">Bank Reconciliation</h3>
          <p className="reconciliation-inline__subtitle">Match ledger transactions with bank records</p>
        </div>
        <div className="reconciliation-inline__actions">
          {results && (
            <div className="reconciliation-inline__match-badge">
              <span className="reconciliation-inline__match-rate" style={{ color: '#22C55E' }}>
                {matchRate}%
              </span>
              <span className="reconciliation-inline__match-label">Match Rate</span>
            </div>
          )}
          <ChevronDown
            size={24}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="reconciliation-inline__content">
          {/* Upload Section */}
          {!results ? (
            <div className="reconciliation-inline__upload-section">
              <div className="reconciliation-inline__upload-area">
                <Upload size={32} style={{ color: '#6366F1' }} />
                <p className="reconciliation-inline__upload-label">Upload Ledger File</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="reconciliation-inline__file-input"
                  style={{ display: 'none' }}
                  id="file-input"
                />
                <label htmlFor="file-input" className="reconciliation-inline__upload-btn">
                  Choose File
                </label>
                {ledgerFile && (
                  <p className="reconciliation-inline__file-name">{ledgerFile.name}</p>
                )}
              </div>

              <button
                onClick={handleReconcile}
                disabled={!ledgerFile || loading}
                className="reconciliation-inline__reconcile-btn"
              >
                {loading ? (
                  <>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  'Start Reconciliation'
                )}
              </button>

              {error && (
                <div className="reconciliation-inline__error">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="reconciliation-inline__results-summary">
                <div className="reconciliation-inline__summary-card reconciliation-inline__summary-card--matched">
                  <CheckCircle size={24} />
                  <div className="reconciliation-inline__summary-info">
                    <p className="reconciliation-inline__summary-label">MATCHED</p>
                    <p className="reconciliation-inline__summary-value">{statusCounts.matched}</p>
                  </div>
                </div>

                <div className="reconciliation-inline__summary-card reconciliation-inline__summary-card--missing">
                  <AlertCircle size={24} />
                  <div className="reconciliation-inline__summary-info">
                    <p className="reconciliation-inline__summary-label">MISSING</p>
                    <p className="reconciliation-inline__summary-value">{statusCounts.missing}</p>
                  </div>
                </div>

                <div className="reconciliation-inline__summary-card reconciliation-inline__summary-card--partial">
                  <AlertTriangle size={24} />
                  <div className="reconciliation-inline__summary-info">
                    <p className="reconciliation-inline__summary-label">PARTIAL MATCH</p>
                    <p className="reconciliation-inline__summary-value">{statusCounts.partial}</p>
                  </div>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="reconciliation-inline__filters-section">
                <input
                  type="text"
                  placeholder="Search voucher / reference / vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="reconciliation-inline__search"
                />

                <div className="reconciliation-inline__filter-buttons">
                  {['all', 'matched', 'missing', 'partial'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`reconciliation-inline__filter-btn ${
                        filter === f ? 'reconciliation-inline__filter-btn--active' : ''
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Table */}
              <div className="reconciliation-inline__table-wrapper">
                <table className="reconciliation-inline__table">
                  <thead>
                    <tr>
                      <th>TRANSACTION ID</th>
                      <th>DATE</th>
                      <th>LEDGER AMOUNT</th>
                      <th>BANK AMOUNT</th>
                      <th>DIFFERENCE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 10).map((item, idx) => {
                      const difference = item.bank_amount !== null && item.bank_amount !== undefined
                        ? item.ledger_amount - item.bank_amount
                        : item.ledger_amount
                      return (
                        <tr 
                          key={idx}
                          style={{
                            backgroundColor: getRowBackgroundColor(item.status),
                          }}
                        >
                          <td>{item.id || '-'}</td>
                          <td>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                          <td>${parseFloat(item.ledger_amount || 0).toFixed(2)}</td>
                          <td>${parseFloat(item.bank_amount || 0).toFixed(2)}</td>
                          <td>${parseFloat(difference || 0).toFixed(2)}</td>
                          <td>
                            <span
                              className={`reconciliation-inline__status reconciliation-inline__status--${item.status.toLowerCase()}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredData.length > 10 && (
                <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem', marginTop: '1rem' }}>
                  Showing 10 of {filteredData.length} transactions
                </p>
              )}

              {/* Actions */}
              <div className="reconciliation-inline__actions-bar">
                <button onClick={handleExportPDF} className="reconciliation-inline__export-btn">
                  <Download size={18} />
                  Export as PDF
                </button>
                <button onClick={() => setResults(null)} className="reconciliation-inline__reset-btn">
                  Start New Reconciliation
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .reconciliation-inline {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid #334155;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .reconciliation-inline__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #334155;
        }

        .reconciliation-inline__title-section {
          flex: 1;
        }

        .reconciliation-inline__title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #f1f5f9;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .reconciliation-inline__subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0.25rem 0 0 0;
        }

        .reconciliation-inline__actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .reconciliation-inline__match-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 1rem;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .reconciliation-inline__match-rate {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .reconciliation-inline__match-label {
          font-size: 0.75rem;
          color: #86efac;
          text-transform: uppercase;
          font-weight: 600;
        }

        .reconciliation-inline__content {
          padding: 1.5rem;
        }

        .reconciliation-inline__upload-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .reconciliation-inline__upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          background: rgba(99, 102, 241, 0.05);
          border: 2px dashed #6366f1;
          border-radius: 8px;
        }

        .reconciliation-inline__upload-label {
          font-size: 0.95rem;
          color: #cbd5e1;
          margin: 0;
        }

        .reconciliation-inline__upload-btn {
          padding: 0.75rem 1.5rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .reconciliation-inline__upload-btn:hover {
          background: #4f46e5;
          transform: translateY(-2px);
        }

        .reconciliation-inline__file-name {
          font-size: 0.875rem;
          color: #86efac;
          margin: 0;
        }

        .reconciliation-inline__reconcile-btn {
          padding: 0.875rem 2rem;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .reconciliation-inline__reconcile-btn:hover:not(:disabled) {
          background: #16a34a;
          transform: translateY(-2px);
        }

        .reconciliation-inline__reconcile-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reconciliation-inline__error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #fca5a5;
          font-size: 0.875rem;
        }

        .reconciliation-inline__results-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .reconciliation-inline__summary-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(51, 65, 85, 0.5);
          border-radius: 8px;
          border: 1px solid #334155;
        }

        .reconciliation-inline__summary-card--matched {
          border-color: rgba(34, 197, 94, 0.3);
        }

        .reconciliation-inline__summary-card--matched svg {
          color: #22c55e;
        }

        .reconciliation-inline__summary-card--missing {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .reconciliation-inline__summary-card--missing svg {
          color: #ef4444;
        }

        .reconciliation-inline__summary-card--partial {
          border-color: rgba(245, 134, 11, 0.3);
        }

        .reconciliation-inline__summary-card--partial svg {
          color: #f5860b;
        }

        .reconciliation-inline__summary-info {
          flex: 1;
        }

        .reconciliation-inline__summary-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 600;
          margin: 0;
        }

        .reconciliation-inline__summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0;
        }

        .reconciliation-inline__filters-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .reconciliation-inline__search {
          padding: 0.75rem 1rem;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #f1f5f9;
          font-size: 0.875rem;
        }

        .reconciliation-inline__search:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .reconciliation-inline__filter-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .reconciliation-inline__filter-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #cbd5e1;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .reconciliation-inline__filter-btn:hover {
          border-color: #6366f1;
          color: #6366f1;
        }

        .reconciliation-inline__filter-btn--active {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }

        .reconciliation-inline__table-wrapper {
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }

        .reconciliation-inline__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .reconciliation-inline__table thead {
          background: rgba(51, 65, 85, 0.5);
          border-bottom: 1px solid #334155;
        }

        .reconciliation-inline__table th {
          padding: 0.75rem;
          text-align: left;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
        }

        .reconciliation-inline__table td {
          padding: 0.75rem;
          border-bottom: 1px solid #334155;
          color: #cbd5e1;
        }

        .reconciliation-inline__table tbody tr:hover {
          background: rgba(99, 102, 241, 0.05) !important;
        }

        .reconciliation-inline__table tbody tr[style*="rgba(239, 68, 68"]]:hover {
          background: rgba(239, 68, 68, 0.15) !important;
        }

        .reconciliation-inline__table tbody tr[style*="rgba(245, 134, 11"]]:hover {
          background: rgba(245, 134, 11, 0.15) !important;
        }

        .reconciliation-inline__status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .reconciliation-inline__status--matched {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
        }

        .reconciliation-inline__status--missing {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        .reconciliation-inline__status--partial {
          background: rgba(245, 134, 11, 0.15);
          color: #fdba74;
        }

        .reconciliation-inline__actions-bar {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .reconciliation-inline__export-btn,
        .reconciliation-inline__reset-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
        }

        .reconciliation-inline__export-btn {
          background: #6366f1;
          color: white;
        }

        .reconciliation-inline__export-btn:hover {
          background: #4f46e5;
          transform: translateY(-2px);
        }

        .reconciliation-inline__reset-btn {
          background: transparent;
          border: 1px solid #334155;
          color: #cbd5e1;
        }

        .reconciliation-inline__reset-btn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .reconciliation-inline__table {
            font-size: 0.75rem;
          }

          .reconciliation-inline__table th,
          .reconciliation-inline__table td {
            padding: 0.5rem;
          }

          .reconciliation-inline__results-summary {
            grid-template-columns: 1fr;
          }

          .reconciliation-inline__filter-buttons {
            flex-direction: column;
          }

          .reconciliation-inline__filter-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default BankReconciliationInline
