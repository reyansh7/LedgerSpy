import React, { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { MdGppMaybe, MdInfo, MdAutoGraph } from 'react-icons/md'
import PageTransition from '../components/ui/PageTransition'
import RiskGauge from '../components/ui/RiskGauge'
import SHAPChart from '../components/charts/SHAPChart'

const transactionDetails = [
  { label: 'Transaction ID', value: 'TXN-2024-8912-0001' },
  { label: 'Date', value: '13 Aug 2024' },
  { label: 'Vendor', value: 'Global Solutions Ltd' },
  { label: 'Amount', value: '₹9,85,000' },
  { label: 'Category', value: 'Professional Services' },
  { label: 'Payment Method', value: 'Wire Transfer' },
]

const contributingFactors = [
  { name: 'Unusual Amount', desc: 'Transaction is 4.6x larger than the usual transactions with similar patterns.', value: '95%', color: '#EF4444' },
  { name: 'Vendor Similarity', desc: 'Vendor name is 93% similar to previously flagged vendor "Global Solutions Inc".', value: '93%', color: '#F5860B' },
  { name: 'Benford Deviation', desc: 'The first digit "9" appears 3.8x more than expected.', value: '20%', color: '#EAB308' },
]

const shapFeatures = [
  { label: 'Amount', value: +4.68 },
  { label: 'Vendor Match', value: +3.21 },
  { label: 'Benford Dev', value: +4.21 },
  { label: 'Transaction Freq.', value: -1.56 },
  { label: 'Day of Week', value: -0.85 },
  { label: 'Category', value: +1.12 },
]

export default function ExplainAI() {
  const pageRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.explain-card',
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out' }
      )
      gsap.fromTo('.contributing-factor',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
      )
    }, pageRef)
    return () => ctx.revert()
  }, [])

  return (
    <PageTransition>
      <div className="page" ref={pageRef}>
        <div className="page__header">
          <h1 className="page__title">Explain AI</h1>
          <p className="page__subtitle">Understand why a transaction was flagged by our AI models</p>
        </div>

        <div className="explain-page">
          <div className="explain-page__left">
            {/* Transaction Details */}
            <div className="explain-card">
              <h3 className="explain-card__title">
                <MdInfo style={{ color: 'var(--accent-purple)' }} />
                Transaction Details
              </h3>
              <div className="transaction-detail">
                {transactionDetails.map((d, i) => (
                  <div className="transaction-detail__row" key={i}>
                    <span className="transaction-detail__label">{d.label}</span>
                    <span className="transaction-detail__value">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Score */}
            <div className="explain-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <h3 className="explain-card__title" style={{ alignSelf: 'flex-start' }}>
                <MdGppMaybe style={{ color: '#EF4444' }} />
                Risk Assessment
              </h3>
              <RiskGauge score={92} size={180} strokeWidth={12} />
            </div>
          </div>

          <div className="explain-page__right">
            {/* Why Flagged */}
            <div className="explain-card">
              <h3 className="explain-card__title">
                <MdGppMaybe style={{ color: '#F5860B' }} />
                Why this transaction is flagged?
              </h3>
              <div className="contributing-factors">
                {contributingFactors.map((f, i) => (
                  <div className="contributing-factor" key={i}>
                    <span className="contributing-factor__dot" style={{ background: f.color }} />
                    <div className="contributing-factor__info">
                      <div className="contributing-factor__name">{f.name}</div>
                      <div className="contributing-factor__desc">{f.desc}</div>
                    </div>
                    <span className="contributing-factor__value" style={{ color: f.color }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Impact (SHAP) */}
            <div className="explain-card">
              <h3 className="explain-card__title">
                <MdAutoGraph style={{ color: 'var(--accent-purple)' }} />
                Feature Impact (SHAP)
              </h3>
              <SHAPChart features={shapFeatures} />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
