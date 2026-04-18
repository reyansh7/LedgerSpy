import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { MdTrendingUp, MdWarning, MdCompareArrows, MdBarChart, MdVisibility } from 'react-icons/md'
import PageTransition from '../components/ui/PageTransition'
import StatCard from '../components/ui/StatCard'
import TabBar from '../components/ui/TabBar'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Pagination from '../components/ui/Pagination'

const anomaliesData = [
  { id: 1, date: '13 Aug 2024', vendor: 'Global Solutions Ltd', amount: '₹9,85,000', riskScore: 97, type: 'Unusual Amount', status: 'High Risk' },
  { id: 2, date: '11 Aug 2024', vendor: 'Prime Tech Services', amount: '₹7,43,300', riskScore: 85, type: 'Vendor Match', status: 'High Risk' },
  { id: 3, date: '11 Aug 2024', vendor: 'Alpha Trading Co.', amount: '₹9,20,000', riskScore: 97, type: 'Benford Deviation', status: 'High Risk' },
  { id: 4, date: '10 Aug 2024', vendor: 'Dynamic Supplies', amount: '₹3,13,600', riskScore: 67, type: 'Unusual Amount', status: 'Medium Risk' },
  { id: 5, date: '05 Aug 2024', vendor: 'NextGen Industries', amount: '₹8,75,200', riskScore: 74, type: 'Vendor Match', status: 'Medium Risk' },
  { id: 6, date: '07 Aug 2024', vendor: 'Pacific Retailers', amount: '₹2,43,000', riskScore: 43, type: 'Benford Deviation', status: 'Normal' },
  { id: 7, date: '01 Aug 2024', vendor: 'Bright Enterprises', amount: '₹1,12,000', riskScore: 12, type: 'Normal', status: 'Normal' },
]

const tabs = [
  { key: 'anomalies', label: 'Anomalies' },
  { key: 'benford', label: 'Benford Analysis' },
  { key: 'vendor', label: 'Vendor Matches' },
  { key: 'risk', label: 'Risk Overview' },
]

export default function Results() {
  const [activeTab, setActiveTab] = useState('anomalies')
  const [currentPage, setCurrentPage] = useState(1)
  const pageRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.stats-grid .stat-card',
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      )
      gsap.fromTo('.tab-bar',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: 'power2.out' }
      )
    }, pageRef)
    return () => ctx.revert()
  }, [])

  const RiskScoreBar = ({ score }) => {
    const color = score >= 80 ? '#EF4444' : score >= 50 ? '#F5860B' : '#22C55E'
    return (
      <div className="risk-score-bar">
        <div className="risk-score-bar__track">
          <div className="risk-score-bar__fill" style={{ width: `${score}%`, background: color }} />
        </div>
        <span className="risk-score-bar__value" style={{ color }}>{score}</span>
      </div>
    )
  }

  const columns = [
    { key: 'id', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'amount', label: 'Amount' },
    { key: 'riskScore', label: 'Risk Score', render: (val) => <RiskScoreBar score={val} /> },
    { key: 'type', label: 'Type', render: (val) => <StatusBadge status={val} /> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'action', label: 'Action', render: (_, row) => (
      <button className="action-icon" title="View Details">
        <MdVisibility />
      </button>
    )},
  ]

  return (
    <PageTransition>
      <div className="page results-page" ref={pageRef}>
        <div className="page__header">
          <h1 className="page__title">Analysis Results</h1>
          <p className="page__subtitle">Detailed breakdown of fraud detection analysis</p>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Total Transactions"
            value="128,420"
            icon={<MdTrendingUp />}
            color="purple"
            change="(2.21%)"
          />
          <StatCard
            label="High Risk"
            value="2,843"
            icon={<MdWarning />}
            color="red"
          />
          <StatCard
            label="Benford Deviation"
            value="68.4%"
            icon={<MdBarChart />}
            color="orange"
          />
          <StatCard
            label="Matches"
            value="312"
            icon={<MdCompareArrows />}
            color="blue"
          />
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="results-page__table-section">
          <DataTable
            columns={columns}
            data={anomaliesData}
            footer={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Showing 1 to 7 of 127 results</span>
                <Pagination currentPage={currentPage} totalPages={19} onPageChange={setCurrentPage} />
              </div>
            }
          />
        </div>
      </div>
    </PageTransition>
  )
}
