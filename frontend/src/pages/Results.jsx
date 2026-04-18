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
      className="mx-auto w-full max-w-7xl space-y-6 p-6"
    >
      <header>
        <h1 className="text-3xl font-bold text-slate-100">Fraud Analysis Results</h1>
        <p className="mt-1 text-sm text-slate-400">File ID: {results.file_id}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Records" value={results.summary?.total_records ?? 0} color="primary" />
        <StatCard title="Flagged Records" value={results.summary?.flagged_records ?? 0} color="warning" />
        <StatCard
          title="Benford Risk"
          value={`${results.summary?.benford_risk ?? 0}%`}
          color="warning"
        />
        <StatCard
          title="Vendor Match Alerts"
          value={results.summary?.fuzzy_match_count ?? 0}
          color="success"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Benford Digit Distribution" subtitle="Observed vs expected first-digit percentage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benfordChartData}>
              <XAxis dataKey="digit" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="expected" fill="#0ea5e9" name="Expected %" />
              <Bar dataKey="observed" fill="#14b8a6" name="Observed %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Score Distribution" subtitle="Low, medium, and high-risk transaction buckets">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskDistributionData} dataKey="value" nameKey="name" outerRadius={85} label>
                {riskDistributionData.map((entry, idx) => (
                  <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-100">Potential Ghost Vendor Matches</h2>
        {results.fuzzy_matches?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {results.fuzzy_matches.slice(0, 9).map((match, idx) => (
              <article key={`${match.vendor_1}-${match.vendor_2}-${idx}`} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-300">{match.vendor_1}</p>
                <p className="text-sm text-slate-300">{match.vendor_2}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-cyan-300">Similarity: {match.risk_score}%</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            No suspicious vendor similarities found.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-100">Transaction Risk Table</h2>
        <DataTable rows={results.transactions || []} />
      </section>
    </motion.div>
  )
}
