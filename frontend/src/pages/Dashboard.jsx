import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MdTrendingUp, MdWarning, MdStorefront, MdInsertDriveFile } from 'react-icons/md'
import PageTransition from '../components/ui/PageTransition'
import StatCard from '../components/ui/StatCard'
import DataTable from '../components/ui/DataTable'
import ProgressBar from '../components/ui/ProgressBar'
import LineChart from '../components/charts/LineChart'
import DonutChart from '../components/charts/DonutChart'

const recentAnalyses = [
  { file: 'Q3_Ledger_August.csv', date: '13 Aug 2024', transactions: '45,231', highRisk: 1023, status: 'Completed' },
  { file: 'Q3_Ledger_July.csv', date: '08 Aug 2024', transactions: '36,421', highRisk: 871, status: 'Completed' },
  { file: 'Q3_Ledger_June.csv', date: '01 Aug 2024', transactions: '44,768', highRisk: 945, status: 'Completed' },
  { file: 'Q2_Ledger_May.csv', date: '28 Jul 2024', transactions: '41,190', highRisk: 906, status: 'Completed' },
]

const topVendors = [
  { name: 'Global Solutions Ltd', score: 89, color: '#EF4444' },
  { name: 'Prime Tech Services', score: 76, color: '#F5860B' },
  { name: 'Alpha Trading Co.', score: 65, color: '#F5860B' },
  { name: 'NextGen Industries', score: 54, color: '#EAB308' },
  { name: 'Pacific Retailers', score: 42, color: '#22C55E' },
]

export default function Dashboard() {
  const pageRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.stats-grid .stat-card',
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      )
      gsap.fromTo('.chart-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out', delay: 0.3 }
      )
      gsap.fromTo('.dashboard__bottom-row > div',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out', delay: 0.5 }
      )
    }, pageRef)

    return () => ctx.revert()
  }, [])

  const tableColumns = [
    { key: 'file', label: 'File Name' },
    { key: 'date', label: 'Date' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'highRisk', label: 'High Risk', render: (val) => (
      <span style={{ color: '#EF4444', fontWeight: 600 }}>{val}</span>
    )},
  ]

  return (
    <PageTransition>
      <div className="page" ref={pageRef}>
        <div className="page__header">
          <h1 className="page__title">Dashboard</h1>
          <p className="page__subtitle">Welcome back! Here's your fraud detection overview.</p>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Total Transactions"
            value="128,420"
            icon={<MdTrendingUp />}
            color="purple"
            change="+12.5% from last analysis"
            changeDir="up"
          />
          <StatCard
            label="High Risk Transactions"
            value="2,843"
            icon={<MdWarning />}
            color="red"
            change="2.21% of total"
            changeDir="up"
          />
          <StatCard
            label="Total Vendors"
            value="8,753"
            icon={<MdStorefront />}
            color="green"
            change="+6.7% from last analysis"
            changeDir="up"
          />
          <StatCard
            label="Files Analyzed"
            value="24"
            icon={<MdInsertDriveFile />}
            color="blue"
            change="+8 this week"
            changeDir="up"
          />
        </div>

        <div className="dashboard__charts-row">
          <div className="chart-card">
            <div className="chart-card__header">
              <h3 className="chart-card__title">Risk Trend</h3>
            </div>
            <LineChart />
          </div>

          <div className="chart-card">
            <div className="chart-card__header">
              <h3 className="chart-card__title">Risk Distribution</h3>
            </div>
            <DonutChart />
            <div className="donut-legend">
              <div className="donut-legend__item">
                <span className="donut-legend__color" style={{ background: '#EF4444' }}></span>
                <span className="donut-legend__label">High Risk</span>
                <span className="donut-legend__value">21.8%</span>
              </div>
              <div className="donut-legend__item">
                <span className="donut-legend__color" style={{ background: '#F5860B' }}></span>
                <span className="donut-legend__label">Medium Risk</span>
                <span className="donut-legend__value">28.7%</span>
              </div>
              <div className="donut-legend__item">
                <span className="donut-legend__color" style={{ background: '#22C55E' }}></span>
                <span className="donut-legend__label">Low Risk</span>
                <span className="donut-legend__value">49.5%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard__bottom-row">
          <div className="chart-card">
            <div className="chart-card__header">
              <h3 className="chart-card__title">Top 5 Risky Vendors</h3>
            </div>
            <div className="vendor-risk-list">
              {topVendors.map((v, i) => (
                <div className="vendor-risk-item" key={i}>
                  <div className="vendor-risk-item__header">
                    <span className="vendor-risk-item__name">{v.name}</span>
                    <span className="vendor-risk-item__score" style={{ color: v.color }}>{v.score}</span>
                  </div>
                  <ProgressBar value={v.score} color={v.color} showValue={false} height={6} />
                </div>
              ))}
            </div>
          </div>

          <DataTable
            title="Recent Analyses"
            columns={tableColumns}
            data={recentAnalyses}
          />
        </div>
      </div>
    </PageTransition>
  )
}
