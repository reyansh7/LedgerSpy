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
} from 'recharts'

import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Loader from '../components/Loader'
import StatCard from '../components/StatCard'
import { getAnalysisResults } from '../services/api'
import { AppContext } from '../context/AppContext'

const PIE_COLORS = ['#22d3ee', '#fb7185', '#f59e0b', '#a78bfa', '#34d399']

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
      digit,
      expected: Number(values.expected_pct?.toFixed?.(2) ?? values.expected_pct ?? 0),
      observed: Number(values.observed_pct?.toFixed?.(2) ?? values.observed_pct ?? 0),
    }))
  }, [results])

  const riskDistributionData = useMemo(() => {
    const scores = results?.risk_scores || []
    const buckets = [
      { name: 'Low (0-39)', value: 0 },
      { name: 'Medium (40-69)', value: 0 },
      { name: 'High (70-100)', value: 0 },
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

  if (loading) {
    return (
      <div className="p-6">
        <Loader />
      </div>
    )
  }

  if (error) {
    return <div className="p-6 text-rose-300">{error}</div>
  }

  if (!results) {
    return <div className="p-6 text-slate-300">No results found. Please upload a file first.</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-7xl space-y-8 p-6"
    >
      {/* Header Section */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-bold text-slate-50"
        >
          Fraud Analysis Results
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm font-mono text-slate-400"
        >
          File ID: <span className="text-cyan-400">{results.file_id}</span>
        </motion.p>
      </div>

      {/* Stats Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard title="Total Records" value={results.summary?.total_records ?? 0} color="primary" />
        <StatCard title="Flagged Records" value={results.summary?.flagged_records ?? 0} color="warning" />
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

      {/* Charts Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-6 xl:grid-cols-2"
      >
        <div className="glass-card rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 p-6 backdrop-blur-xl transition-all hover:border-slate-700/80">
          <header className="mb-6 space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-slate-50">Benford Digit Distribution</h3>
            <p className="text-sm text-slate-400">Observed vs expected first-digit percentage</p>
          </header>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benfordChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="digit" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="expected" fill="#0ea5e9" name="Expected %" radius={[8, 8, 0, 0]} />
                <Bar dataKey="observed" fill="#14b8a6" name="Observed %" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/20 p-6 backdrop-blur-xl transition-all hover:border-slate-700/80">
          <header className="mb-6 space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-slate-50">Risk Score Distribution</h3>
            <p className="text-sm text-slate-400">Low, medium, and high-risk transaction buckets</p>
          </header>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistributionData} dataKey="value" nameKey="name" outerRadius={100} label={{ fill: '#94a3b8', fontSize: 12 }}>
                  {riskDistributionData.map((entry, idx) => (
                    <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.section>

      {/* Ghost Vendor Matches */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="space-y-1 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-slate-50">Potential Ghost Vendor Matches</h2>
          <p className="text-sm text-slate-400">Vendors with high similarity scores detected</p>
        </div>
        {results.fuzzy_matches?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.fuzzy_matches.slice(0, 9).map((match, idx) => (
              <motion.article
                key={`${match.vendor_1}-${match.vendor_2}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                className="group rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/40 to-slate-800/20 p-5 transition-all hover:border-cyan-500/30 hover:bg-slate-900/60"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vendor 1</p>
                    <p className="mt-1 text-sm font-medium text-slate-100 line-clamp-2">{match.vendor_1}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vendor 2</p>
                    <p className="mt-1 text-sm font-medium text-slate-100 line-clamp-2">{match.vendor_2}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                    <span className="text-xs text-slate-400">Similarity</span>
                    <span className="font-semibold text-cyan-400">{match.risk_score}%</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/40 to-slate-800/20 p-6 text-center">
            <p className="text-sm text-slate-400">✓ No suspicious vendor similarities found.</p>
          </div>
        )}
      </motion.section>

      {/* Transaction Risk Table */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="space-y-1 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-slate-50">Transaction Risk Analysis</h2>
          <p className="text-sm text-slate-400">Detailed breakdown of all transactions</p>
        </div>
        <DataTable rows={results.transactions || []} />
      </motion.section>
    </motion.div>
  )
}
