import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAnalysisResults } from '../services/api'
import Table from '../components/Table'

export default function Results() {
  const [searchParams] = useSearchParams()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fileId = searchParams.get('fileId')
    if (!fileId) {
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await getAnalysisResults(fileId)
        setResults(response.data)
      } catch (error) {
        console.error('Failed to fetch results:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [searchParams])

  if (loading) return <div>Loading results...</div>
  if (!results) return <div>No results found. Please upload a file first.</div>

  return (
    <div className="results-page">
      <h1>Analysis Results</h1>
      
      <section className="results-section">
        <h2>Benford's Law Analysis</h2>
        {results.analysis?.benford && (
          <div className="result-card">
            <p><strong>Chi-Square:</strong> {results.analysis.benford.chi_square}</p>
            <p><strong>Verdict:</strong> {results.analysis.benford.verdict}</p>
          </div>
        )}
      </section>

      <section className="results-section">
        <h2>Detected Anomalies</h2>
        {results.analysis?.anomalies?.length > 0 && (
          <Table 
            data={results.analysis.anomalies} 
            columns={['index', 'value', 'score']} 
          />
        )}
      </section>

      <section className="results-section">
        <h2>Fuzzy Matches</h2>
        {results.analysis?.fuzzy_matches?.length > 0 && (
          <Table 
            data={results.analysis.fuzzy_matches} 
            columns={['index1', 'index2', 'similarity']} 
          />
        )}
      </section>
    </div>
  )
}
