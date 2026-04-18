import React, { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import Chart from '../components/Chart'
import { getDashboardStats } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats()
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <StatCard title="Total Files" value={stats?.total_files} icon="📁" />
        <StatCard title="Total Records" value={stats?.total_records} icon="📊" />
        <StatCard title="Anomalies" value={stats?.anomalies_detected} icon="⚠️" color="warning" />
        <StatCard title="Accuracy" value={`${(stats?.accuracy * 100).toFixed(1)}%`} icon="🎯" color="success" />
      </div>
      <div className="charts-grid">
        <Chart title="Analysis Trends" type="line" />
        <Chart title="Risk Distribution" type="pie" />
      </div>
    </div>
  )
}
