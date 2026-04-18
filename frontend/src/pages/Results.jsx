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
import ExplainableRiskBreakdown from '../components/ExplainableRiskBreakdown'
import AuditReportGenerator from '../components/AuditReportGenerator'
import BankReconciliation from '../components/BankReconciliation'
import GoingConcernStressTest from '../components/GoingConcernStressTest'
import IndustryBenchmarkComparison from '../components/IndustryBenchmarkComparison'
import RelationalRiskMapping from '../components/RelationalRiskMapping'
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
  const [goingConcernData, setGoingConcernData] = useState(null)
  const [industryBenchmarkData, setIndustryBenchmarkData] = useState(null)
  const [selectedIndustry, setSelectedIndustry] = useState('technology')

  useEffect(() => {
    const fileId = searchParams.get('fileId')
    if (!fileId) {
      setError('Missing file id. Upload a file first.')
      setLoading(false)
      return
    }

    if (resultsData?.file_id === fileId) {
      setLoading(false)
      // Fetch going concern and benchmark data
      fetchAdvancedAnalytics(fileId)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await getAnalysisResults(fileId)
        setResultsData(response.data)
        // Fetch advanced analytics
        fetchAdvancedAnalytics(fileId)
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [resultsData, searchParams, setResultsData])

  const fetchAdvancedAnalytics = async (fileId) => {
    try {
      // Fetch going concern data
      const gcResponse = await fetch(`/api/going-concern/${fileId}`)
      console.log('Going Concern API response status:', gcResponse.status)
      if (gcResponse.ok) {
        const gcData = await gcResponse.json()
        console.log('Going Concern data received:', gcData)
        setGoingConcernData(gcData)
      } else {
        console.error('Going Concern API error:', gcResponse.status, gcResponse.statusText)
        const errorText = await gcResponse.text()
        console.error('Error details:', errorText)
      }

      // Fetch industry benchmark data
      const ibResponse = await fetch(`/api/audit/industry-benchmark/sample?industry=${selectedIndustry}`)
      if (ibResponse.ok) {
        setIndustryBenchmarkData(await ibResponse.json())
      }
    } catch (error) {
      console.error('Failed to fetch advanced analytics:', error)
    }
  }

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
        <StatCard title="Total Records" value={(results.summary?.total_records ?? 0).toLocaleString('en-IN')} color="primary" />
        <StatCard title="Flagged Records" value={(results.summary?.flagged_records ?? 0).toLocaleString('en-IN')} color="warning" />
        <StatCard
          title="Benford Risk"
          value={`${(results.summary?.benford_risk ?? 0).toFixed(1)}%`}
          color="danger"
        />
        <StatCard
          title="Vendor Match Alerts"
          value={(results.summary?.fuzzy_match_count ?? 0).toLocaleString('en-IN')}
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
      {/* ===== SUSPICIOUS TRANSACTIONS ===== */}
      <motion.section
        custom={3}
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
        custom={4}
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
        custom={5}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <VendorSimilarityDetection fuzzyMatches={results.fuzzy_matches || []} />
      </motion.section>

      {/* ===== EXPLAINABLE AI ===== */}
      <motion.section
        custom={6}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <ExplainableAIPanel anomalies={results.anomalies || []} />
      </motion.section>

      {/* ===== RISK BREAKDOWN WITH AI EXPLANATIONS ===== */}
      <motion.section
        custom={7}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        {(() => {
          // Calculate risk scores using consistent methodology
          // Use risk_scores from API for anomaly detection
          const riskScores = results.risk_scores || [];
          const anomalyRiskMean = riskScores.length 
            ? (riskScores.reduce((sum, rs) => sum + (rs.risk_score || 0), 0) / riskScores.length)
            : 50; // Default anomaly score
          
          // Use summary data for vendor and benford
          const benfordRisk = Math.min(results.summary?.benford_risk || 0, 100);
          const fuzzyMatchCount = results.summary?.fuzzy_match_count || 0;
          const totalRecords = results.summary?.total_records || 1;
          
          // Vendor score: percentage of records with fuzzy matches
          const vendorRiskPercentage = (fuzzyMatchCount / Math.max(totalRecords, 1)) * 100;
          
          return (
            <ExplainableRiskBreakdown 
              anomalyScore={Math.round(anomalyRiskMean)}
              vendorScore={Math.round(vendorRiskPercentage)}
              benfordScore={Math.round(benfordRisk)}
              useAIExplanations={true}
            />
          );
        })()}
      </motion.section>

      {/* ===== BANK RECONCILIATION ===== */}
      <motion.section
        custom={8}
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

      {/* ===== GOING CONCERN STRESS TEST ===== */}
      <motion.section
        custom={9}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <GoingConcernStressTest data={goingConcernData} />
      </motion.section>

      {/* ===== RELATIONAL RISK MAPPING ===== */}
      <motion.section
        custom={10}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <RelationalRiskMapping graphData={buildGraphData(results)} />
      </motion.section>

      {/* ===== INDUSTRY BENCHMARKING ===== */}
      <motion.section
        custom={11}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ color: '#9CA3AF', fontSize: '0.9rem', fontWeight: 600 }}>Select Industry Sector:</label>
          <select 
            value={selectedIndustry}
            onChange={(e) => {
              setSelectedIndustry(e.target.value)
              fetchAdvancedAnalytics(results.file_id)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <option value="technology">Technology</option>
            <option value="finance">Finance & Banking</option>
            <option value="retail">Retail & E-commerce</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="healthcare">Healthcare</option>
            <option value="government">Government & Public</option>
          </select>
        </div>
        <IndustryBenchmarkComparison data={industryBenchmarkData} />
      </motion.section>

      {/* ===== AUDIT REPORT ===== */}
      <motion.section
        custom={12}
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

// Build graph data from analysis results for relational risk mapping
function buildGraphData(results) {
  if (!results) {
    return { nodes: [], links: [] };
  }

  const nodes = [];
  const links = [];
  const vendorMap = new Map();
  const entityMap = new Map();

  try {
    // Use the transactions array and anomalies data from backend
    const transactions = results.transactions || [];
    const anomalies = results.anomalies || [];
    const riskScores = results.risk_scores || [];
    
    console.log('📊 Graph Data Debug:');
    console.log(`  Total transactions: ${transactions.length}`);
    console.log(`  Total anomalies: ${anomalies.length}`);
    console.log(`  Total risk scores: ${riskScores.length}`);

    // Create a map of transaction_id -> risk_score for quick lookup
    const riskScoreMap = new Map();
    riskScores.forEach(rs => {
      riskScoreMap.set(String(rs.transaction_id), rs.risk_score);
    });

    // Process ALL transactions to get complete vendor/entity mapping with risk scores
    transactions.forEach((tx, idx) => {
      if (!tx) return;

      // Use destination_entity as the vendor (or source for bidirectional)
      const destEntity = String(tx.destination_entity || `Entity_${idx}`).substring(0, 50).trim();
      const srcEntity = String(tx.source_entity || `Entity_${idx}`).substring(0, 50).trim();
      const txId = String(tx.transaction_id);
      const amount = parseFloat(tx.amount) || 0;
      
      // Get risk score from risk_scores array or use tx.risk_score
      let riskScore = riskScoreMap.get(txId) || tx.risk_score || 0;
      riskScore = Math.min(100, Math.max(0, riskScore));

      // Add destination entity (vendor receiving money - main focus)
      if (!vendorMap.has(destEntity)) {
        vendorMap.set(destEntity, {
          id: destEntity,
          name: destEntity,
          riskScore: riskScore,
          group: 'vendor',
          transactionCount: 1,
        });
      } else {
        // Update max risk for this vendor
        const existing = vendorMap.get(destEntity);
        existing.riskScore = Math.max(existing.riskScore, riskScore);
        existing.transactionCount = (existing.transactionCount || 1) + 1;
      }

      // Add source entity (employee/department sending money)
      if (!entityMap.has(srcEntity)) {
        entityMap.set(srcEntity, {
          id: srcEntity,
          name: srcEntity,
          riskScore: Math.min(100, Math.max(20, riskScore * 0.7)), // Entities inherit reduced risk
          group: 'employee',
          transactionCount: 1,
        });
      } else {
        const existing = entityMap.get(srcEntity);
        existing.transactionCount = (existing.transactionCount || 1) + 1;
      }

      // Create link
      if (amount > 0) {
        links.push({
          source: destEntity,
          target: srcEntity,
          amount: amount,
          riskScore: riskScore,
        });
      }
    });

    // Combine all nodes
    const allNodes = [
      ...Array.from(vendorMap.values()),
      ...Array.from(entityMap.values()),
    ];

    console.log(`✅ Graph nodes created: ${allNodes.length}`);
    console.log(`  Critical (>80): ${allNodes.filter(n => n.riskScore > 80).length}`);
    console.log(`  High (50-80): ${allNodes.filter(n => n.riskScore >= 50 && n.riskScore <= 80).length}`);
    console.log(`  Low (<50): ${allNodes.filter(n => n.riskScore < 50).length}`);
    console.log(`✅ Graph links created: ${links.length}`);
    
    // Debug: show top 5 high-risk nodes
    const topRisk = allNodes.sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
    console.log('🔴 Top 5 High-Risk Nodes:');
    topRisk.forEach(n => {
      console.log(`  ${n.name}: ${n.riskScore.toFixed(1)}% (${n.transactionCount} transactions)`);
    });

    return { nodes: allNodes, links };
  } catch (e) {
    console.error('❌ Error building graph data:', e);
    console.error(e.stack);
    return { nodes: [], links: [] };
  }
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
