import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { MdVisibility, MdCheckCircle } from 'react-icons/md'
import PageTransition from '../components/ui/PageTransition'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Pagination from '../components/ui/Pagination'

const historyData = [
  { file: 'Q3_Ledger_August.csv', date: '12 Aug 2024', transactions: '45,231', highRisk: 1023, status: 'Completed' },
  { file: 'Q3_Ledger_July.csv', date: '08 Aug 2024', transactions: '36,421', highRisk: 871, status: 'Completed' },
  { file: 'Q3_Ledger_June.csv', date: '01 Aug 2024', transactions: '44,768', highRisk: 945, status: 'Completed' },
  { file: 'Q2_Ledger_May.csv', date: '28 May 2024', transactions: '41,190', highRisk: 906, status: 'Completed' },
  { file: 'Q2_Ledger_April.csv', date: '30 Apr 2024', transactions: '36,333', highRisk: 721, status: 'Completed' },
  { file: 'Q1_Ledger_March.csv', date: '15 Mar 2024', transactions: '41,321', highRisk: 888, status: 'Completed' },
]

export default function History() {
  const [currentPage, setCurrentPage] = useState(1)
  const pageRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.data-table-wrapper',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
      )
    }, pageRef)
    return () => ctx.revert()
  }, [])

  const columns = [
    { key: 'file', label: 'File Name' },
    { key: 'date', label: 'Date' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'highRisk', label: 'High Risk', render: (val) => (
      <span style={{ color: '#EF4444', fontWeight: 600 }}>{val}</span>
    )},
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'action', label: 'Action', render: () => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="action-icon" title="View"><MdVisibility /></button>
      </div>
    )},
  ]

  return (
    <PageTransition>
      <div className="page" ref={pageRef}>
        <div className="page__header">
          <h1 className="page__title">Analysis History</h1>
          <p className="page__subtitle">View all previously analyzed files and their results</p>
        </div>

        <div className="history-page__table">
          <DataTable
            columns={columns}
            data={historyData}
            footer={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Showing 1-6 of 24 files</span>
                <Pagination currentPage={currentPage} totalPages={10} onPageChange={setCurrentPage} />
              </div>
            }
          />
        </div>
      </div>
    </PageTransition>
  )
}
