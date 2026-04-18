import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { MdTune, MdNotifications, MdPalette, MdCheck } from 'react-icons/md'
import PageTransition from '../components/ui/PageTransition'
import Toggle from '../components/ui/Toggle'

const accentColors = [
  { color: '#BB5CF6', name: 'Purple' },
  { color: '#22C55E', name: 'Green' },
  { color: '#3B82F6', name: 'Blue' },
  { color: '#EF4444', name: 'Red' },
  { color: '#F5860B', name: 'Orange' },
  { color: '#06B6D4', name: 'Cyan' },
  { color: '#EC4899', name: 'Pink' },
]

export default function Settings() {
  const [riskThreshold, setRiskThreshold] = useState(70)
  const [benford, setBenford] = useState(true)
  const [vendorMatching, setVendorMatching] = useState(true)
  const [anomalyDetection, setAnomalyDetection] = useState(true)
  const [explainableAI, setExplainableAI] = useState(false)
  const [currency, setCurrency] = useState('INR')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [highRiskAlert, setHighRiskAlert] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [accentColor, setAccentColor] = useState('#BB5CF6')
  const pageRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.settings-section',
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      )
    }, pageRef)
    return () => ctx.revert()
  }, [])

  return (
    <PageTransition>
      <div className="page" ref={pageRef}>
        <div className="page__header">
          <h1 className="page__title">Settings</h1>
          <p className="page__subtitle">Configure your analysis preferences and application settings</p>
        </div>

        <div className="settings-page">
          {/* Analysis Settings */}
          <div className="settings-section">
            <h3 className="settings-section__title">
              <MdTune style={{ color: 'var(--accent-purple)' }} />
              Analysis Settings
            </h3>
            <div className="settings-section__group">
              <div className="range-slider">
                <div className="range-slider__header">
                  <span className="range-slider__label">Risk Threshold</span>
                  <span className="range-slider__value">{riskThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(+e.target.value)}
                  style={{
                    background: `linear-gradient(to right, var(--accent-purple) 0%, var(--accent-purple) ${riskThreshold}%, var(--bg-tertiary) ${riskThreshold}%, var(--bg-tertiary) 100%)`
                  }}
                />
              </div>

              <div className="settings-item">
                <span className="settings-item__label">Enable Benford Analysis</span>
                <Toggle active={benford} onChange={setBenford} />
              </div>

              <div className="settings-item">
                <span className="settings-item__label">Enable Vendor Matching</span>
                <Toggle active={vendorMatching} onChange={setVendorMatching} />
              </div>

              <div className="settings-item">
                <span className="settings-item__label">Enable Anomaly Detection</span>
                <Toggle active={anomalyDetection} onChange={setAnomalyDetection} />
              </div>

              <div className="settings-item">
                <span className="settings-item__label">Explainable AI (SHAP)</span>
                <Toggle active={explainableAI} onChange={setExplainableAI} />
              </div>

              <div className="settings-item">
                <span className="settings-item__label">Default Currency</span>
                <select
                  className="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="settings-section">
            <h3 className="settings-section__title">
              <MdNotifications style={{ color: 'var(--accent-purple)' }} />
              Notifications
            </h3>
            <div className="settings-section__group">
              <div className="checkbox" onClick={() => setEmailAlerts(!emailAlerts)}>
                <div className={`checkbox__box ${emailAlerts ? 'checkbox__box--checked' : ''}`}>
                  {emailAlerts && <MdCheck style={{ fontSize: 14, color: 'white' }} />}
                </div>
                <span className="checkbox__label">Email Alerts</span>
              </div>

              <div className="checkbox" onClick={() => setHighRiskAlert(!highRiskAlert)}>
                <div className={`checkbox__box ${highRiskAlert ? 'checkbox__box--checked' : ''}`}>
                  {highRiskAlert && <MdCheck style={{ fontSize: 14, color: 'white' }} />}
                </div>
                <span className="checkbox__label">High Risk Alert</span>
              </div>

              <div className="checkbox" onClick={() => setWeeklySummary(!weeklySummary)}>
                <div className={`checkbox__box ${weeklySummary ? 'checkbox__box--checked' : ''}`}>
                  {weeklySummary && <MdCheck style={{ fontSize: 14, color: 'white' }} />}
                </div>
                <span className="checkbox__label">Weekly Summary</span>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="settings-section" style={{ gridColumn: '1 / -1' }}>
            <h3 className="settings-section__title">
              <MdPalette style={{ color: 'var(--accent-purple)' }} />
              Appearance
            </h3>
            <div className="settings-section__group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>Theme</p>
                <div className="theme-toggle-group">
                  {['Light', 'Dark', 'Auto'].map(t => (
                    <button
                      key={t}
                      className={`theme-toggle-group__btn ${theme === t.toLowerCase() ? 'theme-toggle-group__btn--active' : ''}`}
                      onClick={() => setTheme(t.toLowerCase())}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>Accent Color</p>
                <div className="color-picker">
                  {accentColors.map(c => (
                    <div
                      key={c.color}
                      className={`color-picker__swatch ${accentColor === c.color ? 'color-picker__swatch--active' : ''}`}
                      style={{ background: c.color }}
                      onClick={() => setAccentColor(c.color)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
