import React, { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { MdTrendingUp, MdWarning, MdBugReport, MdGrade, MdPictureAsPdf, MdTableChart } from 'react-icons/md'
import PageTransition from '../components/ui/PageTransition'
import StatCard from '../components/ui/StatCard'
import DonutChart from '../components/charts/DonutChart'

const findings = [
  'Detected 2,843 high-risk transactions.',
  '312 potential duplicate vendors found.',
  'Benford deviation is 68.4% (High Risk).',
  'Unusual amounts detected in 1,327 transactions.',
  'Wire transfer anomalies in Q3 data set.',
  'Top vendor risk concentration in Professional Services category.',
]

export default function Reports() {
  const pageRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.stat-card',
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      )
      gsap.fromTo('.reports-page__body > div',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out', delay: 0.3 }
      )
      gsap.fromTo('.reports-page__actions .btn',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.6 }
      )
    }, pageRef)
    return () => ctx.revert()
  }, [])

  return (
    <PageTransition>
      <div className="page" ref={pageRef}>
        <div className="page__header">
          <h1 className="page__title">Audit Reports</h1>
          <p className="page__subtitle">Comprehensive audit summary and downloadable reports</p>
        </div>

        <div className="section-header">
          <h2>Audit Summary</h2>
        </div>

        <div className="reports-page__summary stats-grid">
          <StatCard
            label="Total Transactions"
            value="128,420"
            icon={<MdTrendingUp />}
            color="purple"
          />
          <StatCard
            label="High Risk Transactions"
            value="2,843"
            icon={<MdWarning />}
            color="red"
          />
          <StatCard
            label="Total Anomalies"
            value="1,327"
            icon={<MdBugReport />}
            color="orange"
          />
          <StatCard
            label="Overall Risk Score"
            value="68.4"
            icon={<MdGrade />}
            color="blue"
          />
        </div>

        <div className="reports-page__body">
          <div className="chart-card">
            <div className="chart-card__header">
              <h3 className="chart-card__title">Risk Distribution</h3>
            </div>
            <DonutChart
              values={[21.8, 28.7, 49.5]}
              labels={['High Risk', 'Medium Risk', 'Low Risk']}
              colors={['#EF4444', '#F5860B', '#22C55E']}
              centerValue="2.8k"
              centerLabel="High Risk"
              size={200}
            />
            <div className="donut-legend" style={{ marginTop: 20 }}>
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

          <div className="chart-card">
            <div className="chart-card__header">
              <h3 className="chart-card__title">Key Findings</h3>
            </div>
            <div className="findings-list">
              {findings.map((f, i) => (
                <div className="findings-list__item" key={i}>
                  <span className="findings-list__bullet" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="reports-page__actions">
          <button className="btn btn--primary">
            <MdPictureAsPdf /> Download PDF
          </button>
          <button className="btn btn--green">
            <MdTableChart /> Download Excel
          </button>
        </div>
      </div>
    </PageTransition>
  )
}
