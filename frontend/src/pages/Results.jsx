import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from 'recharts'

import Loader from '../components/Loader'
import RiskBadge from '../components/RiskBadge'
import StatCard from '../components/StatCard'
import SuspiciousTransactionsTable from '../components/SuspiciousTransactionsTable'
import DataIntegrityDashboard from '../components/DataIntegrityDashboard'
import VendorSimilarityDetection from '../components/VendorSimilarityDetection'
import ExplainableAIPanel from '../components/ExplainableAIPanel'
import RiskBreakdown from '../components/RiskBreakdown'
import AuditReportGenerator from '../components/AuditReportGenerator'
import BankReconciliation from '../components/BankReconciliation'
import { getAnalysisResults } from '../services/api'
import { AppContext } from '../context/AppContext'

const PIE_COLORS = ['#4ade80', '#f87171', '#fbbf24']

const CustomTooltipStyle = {
  backgroundColor: 'rgba(15, 18, 35, 0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '12px 16px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(12px)',
}

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const GlassCard = ({ children, style, className = '' }) => (
  <div
    className={className}
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

const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.1))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
      }}>
        {icon}
      </div>
      <h2 style={{
        fontSize: '1.35rem',
        fontWeight: 700,
        margin: 0,
        background: 'linear-gradient(135deg, #fff, #94a3b8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {title}
      </h2>
    </div>
    {subtitle && (
      <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 0 48px' }}>{subtitle}</p>
    )}
  </div>
)

export default function Results() {
  const { resultsData, setResultsData } = useContext(AppContext)
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fileId = searchParams.get('fileId')
    if (!fileId) {
      setError('Missing file id. Upload a file first.')
      setLoading(false)
      return
    }

    if (resultsData?.file_id === fileId) {
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await getAnalysisResults(fileId)
        setResultsData(response.data)
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [resultsData, searchParams, setResultsData])

  const results = resultsData

  const benfordChartData = useMemo(() => {
    const distribution = results?.benford?.digit_distribution || {}
    return Object.entries(distribution).map(([digit, values]) => ({
      digit: `D${digit}`,
      expected: Number(values.expected_pct?.toFixed?.(2) ?? values.expected_pct ?? 0),
      observed: Number(values.observed_pct?.toFixed?.(2) ?? values.observed_pct ?? 0),
    }))
  }, [results])

  const riskDistributionData = useMemo(() => {
    const scores = results?.risk_scores || []
    const buckets = [
      { name: 'Low Risk', value: 0 },
      { name: 'Medium Risk', value: 0 },
      { name: 'High Risk', value: 0 },
    ]

    scores.forEach((item) => {
      const score = Number(item.risk_score || 0)
      if (score >= 70) {
        buckets[2].value += 1
      } else if (score >= 40) {
        buckets[1].value += 1
      } else {
        buckets[0].value += 1
      }
    })

    return buckets
  }, [results])

  const overallRiskScore = useMemo(() => {
    const benford = results?.summary?.benford_risk || 0
    const flaggedRatio = results?.summary?.total_records
      ? (results.summary.flagged_records / results.summary.total_records) * 100
      : 0
    return Math.round((benford * 0.6 + flaggedRatio * 0.4))
  }, [results])

  const radialData = useMemo(() => [{
    name: 'Risk',
    value: overallRiskScore,
    fill: overallRiskScore >= 70 ? '#ef4444' : overallRiskScore >= 40 ? '#f59e0b' : '#22c55e',
  }], [overallRiskScore])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <GlassCard style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#f87171', marginBottom: '8px' }}>Analysis Error</h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>{error}</p>
        </GlassCard>
      </div>
    )
  }

  if (!results) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <GlassCard style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📄</div>
          <h3 style={{ marginBottom: '8px' }}>No Results Found</h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Please upload a file first to see analysis results.</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 28px', width: '100%' }}
    >
      {/* ===== HERO HEADER ===== */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
            }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                margin: 0,
                background: 'linear-gradient(135deg, #ffffff, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}>
                Fraud Analysis Results
              </h1>
              <p style={{
                fontSize: '0.78rem',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: '#6B7280',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 6px #22c55e',
                }} />
                File: <span style={{ color: '#a78bfa' }}>{results.file_id}</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Overall Risk Gauge (mini) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '14px 24px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(18, 22, 38, 0.8), rgba(27, 27, 47, 0.5))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ width: '52px', height: '52px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: 'rgba(255,255,255,0.06)' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, margin: 0 }}>
              Overall Risk
            </p>
            <p style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              fontFamily: "'Poppins', sans-serif",
              margin: 0,
              color: overallRiskScore >= 70 ? '#f87171' : overallRiskScore >= 40 ? '#fbbf24' : '#4ade80',
            }}>
              {overallRiskScore}%
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ===== STAT CARDS GRID ===== */}
      <motion.section
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatCard title="Total Records" value={(results.summary?.total_records ?? 0).toLocaleString()} color="primary" />
        <StatCard title="Flagged Records" value={(results.summary?.flagged_records ?? 0).toLocaleString()} color="warning" />
        <StatCard
          title="Benford Risk"
          value={`${results.summary?.benford_risk ?? 0}%`}
          color="danger"
        />
        <StatCard
          title="Vendor Match Alerts"
          value={results.summary?.fuzzy_match_count ?? 0}
          color="success"
        />
      </motion.section>

      {/* ===== CHARTS GRID ===== */}
      <motion.section
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Benford Chart */}
        <GlassCard>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            borderRadius: '20px 20px 0 0',
          }} />
          <header style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.1rem' }}>📊</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Benford Digit Distribution</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '0 0 0 30px' }}>Observed vs expected first-digit percentage</p>
          </header>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benfordChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="digit" stroke="#475569" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                <YAxis stroke="#475569" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#6B7280' }} />
                <Bar dataKey="expected" fill="#3b82f6" name="Expected %" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="observed" fill="#06b6d4" name="Observed %" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(results.summary?.benford_risk ?? 0) > 50 && (
            <div style={{
              marginTop: '16px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '0.85rem' }}>⚠️</span>
              <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                <strong>Significant deviation detected:</strong> Possible data manipulation
              </span>
            </div>
          )}
        </GlassCard>

        {/* Risk Distribution Pie */}
        <GlassCard>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
            borderRadius: '20px 20px 0 0',
          }} />
          <header style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.1rem' }}>📈</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Risk Score Distribution</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '0 0 0 30px' }}>Transaction classification by risk level</p>
          </header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ height: '250px', flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    strokeWidth={2}
                    stroke="rgba(11, 15, 26, 0.8)"
                  >
                    {riskDistributionData.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CustomTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '140px' }}>
              {riskDistributionData.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    background: PIE_COLORS[idx],
                    flexShrink: 0,
                  }} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.section>

      {/* ===== GHOST VENDOR MATCHES ===== */}
      <motion.section
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <SectionHeader
          icon="👻"
          title="Potential Ghost Vendor Matches"
          subtitle="Vendors with high similarity scores indicating possible duplicates"
        />
        {results.fuzzy_matches?.length ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
          }}>
            {results.fuzzy_matches.slice(0, 9).map((match, idx) => (
              <motion.div
                key={`${match.vendor_1}-${match.vendor_2}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.04 }}
                style={{
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'linear-gradient(135deg, rgba(18, 22, 38, 0.6), rgba(27, 27, 47, 0.3))',
                  padding: '18px',
                  transition: 'all 250ms ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <VendorLabel prefix="A" name={match.vendor_1} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <VendorLabel prefix="B" name={match.vendor_2} />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                  }}>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 500 }}>Similarity</span>
                    <span style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: '#22d3ee',
                    }}>
                      {match.risk_score}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassCard style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✅</div>
            <p style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>No suspicious vendor similarities found</p>
          </GlassCard>
        )}
      </motion.section>

      {/* ===== SUSPICIOUS TRANSACTIONS ===== */}
      <motion.section
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <SectionHeader
          icon="🔴"
          title="Suspicious Transactions"
          subtitle="High-risk transactions requiring immediate review"
        />
        <SuspiciousTransactionsTable anomalies={results.anomalies || []} />
      </motion.section>

      {/* ===== DATA INTEGRITY ===== */}
      <motion.section
        custom={5}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <DataIntegrityDashboard 
          readinessReport={results.readiness_report || {}}
          totalRecords={results.summary?.total_records || 0}
        />
      </motion.section>

      {/* ===== VENDOR SIMILARITY ===== */}
      <motion.section
        custom={6}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <VendorSimilarityDetection fuzzyMatches={results.fuzzy_matches || []} />
      </motion.section>

      {/* ===== EXPLAINABLE AI ===== */}
      <motion.section
        custom={7}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <ExplainableAIPanel anomalies={results.anomalies || []} />
      </motion.section>

      {/* ===== RISK BREAKDOWN ===== */}
      <motion.section
        custom={8}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <RiskBreakdown 
          anomalies={results.anomalies || []}
          benfordRisk={results.summary?.benford_risk || 0}
          fuzzyMatchCount={results.summary?.fuzzy_match_count || 0}
        />
      </motion.section>

      {/* ===== BANK RECONCILIATION ===== */}
      <motion.section
        custom={9}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <BankReconciliation 
          anomalies={results.anomalies || []}
          totalRecords={results.summary?.total_records || 0}
        />
      </motion.section>

      {/* ===== AUDIT REPORT ===== */}
      <motion.section
        custom={10}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <AuditReportGenerator results={results} />
      </motion.section>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 1200px) {
          .results-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .results-charts-grid { grid-template-columns: 1fr !important; }
          .results-vendors-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .results-stats-grid { grid-template-columns: 1fr !important; }
          .results-vendors-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}

function VendorLabel({ prefix, name }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '6px',
        background: prefix === 'A'
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.08))'
          : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.6rem',
        fontWeight: 700,
        color: prefix === 'A' ? '#a78bfa' : '#22d3ee',
        flexShrink: 0,
      }}>
        {prefix}
      </div>
      <span style={{
        fontSize: '0.8rem',
        color: '#E5E7EB',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
    </div>
  )
}
