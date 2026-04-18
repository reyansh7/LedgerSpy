import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { MdCloudUpload, MdUploadFile, MdInsights, MdTipsAndUpdates, MdDownload, MdCheckCircle } from 'react-icons/md'
import PageTransition from '../components/ui/PageTransition'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'

const recentUploads = [
  { file: 'March_Ledger.csv', date: '12 May 2024', size: '24.5 MB', status: 'Completed' },
  { file: 'March_Ledger.xlsx', date: '26 Apr 2024', size: '18.7 MB', status: 'Completed' },
  { file: 'Feb_Ledger.csv', date: '15 Mar 2024', size: '21.2 MB', status: 'Completed' },
]

const steps = [
  { icon: <MdUploadFile />, title: 'Upload your file here', desc: 'Drag & drop or browse your CSV/Excel file' },
  { icon: <MdInsights />, title: 'Our AI analyzes the data', desc: 'Ensure your file has columns like Date, Vendor, Amount' },
  { icon: <MdTipsAndUpdates />, title: 'Get insights & fraud alerts', desc: 'View table, date-driven anomaly metrics' },
  { icon: <MdDownload />, title: 'Download report', desc: 'Download the analysis as PDF or Excel' },
]

export default function Upload() {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const pageRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.upload-zone',
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
      )
      gsap.fromTo('.how-it-works__step',
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.2 }
      )
      gsap.fromTo('.data-table-wrapper',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.5 }
      )
    }, pageRef)
    return () => ctx.revert()
  }, [])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0])
      simulateUpload()
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      simulateUpload()
    }
  }

  const simulateUpload = () => {
    setUploading(true)
    setUploaded(false)
    setTimeout(() => {
      setUploading(false)
      setUploaded(true)
      gsap.fromTo('.upload-zone',
        { scale: 1 },
        { scale: 1.02, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' }
      )
    }, 2000)
  }

  const tableColumns = [
    { key: 'file', label: 'File Name' },
    { key: 'date', label: 'Date' },
    { key: 'size', label: 'Size' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ]

  return (
    <PageTransition>
      <div className="page" ref={pageRef}>
        <div className="page__header">
          <h1 className="page__title">Upload Financial Data</h1>
          <p className="page__subtitle">Upload your CSV or Excel file for AI-powered fraud analysis</p>
        </div>

        <div className="upload-page">
          <div className="upload-page__left">
            <div
              ref={dropRef}
              className={`upload-zone ${dragActive ? 'upload-zone--active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-zone__icon">
                {uploaded ? <MdCheckCircle style={{ color: '#22C55E' }} /> : <MdCloudUpload />}
              </div>
              <p className="upload-zone__text">
                {uploading ? 'Uploading...' : uploaded ? `${file?.name} uploaded successfully!` : 'Drag & drop your file here'}
              </p>
              <p className="upload-zone__subtext">
                {uploading ? 'Please wait...' : uploaded ? 'Click to upload another file' : 'Supports: CSV, XLSX, XLS · Max file size: 50MB'}
              </p>
              {!uploading && !uploaded && (
                <button className="upload-zone__btn" onClick={(e) => { e.stopPropagation(); document.getElementById('file-input').click() }}>
                  Browse Files
                </button>
              )}
              {uploading && (
                <div style={{ width: '60%', marginTop: 8 }}>
                  <div className="progress-bar__track" style={{ height: 6 }}>
                    <div className="progress-bar__fill" style={{ width: '70%', background: 'var(--accent-purple)' }} />
                  </div>
                </div>
              )}
            </div>

            <DataTable
              title="Recent Uploads"
              columns={tableColumns}
              data={recentUploads}
            />
          </div>

          <div className="upload-page__right">
            <div className="how-it-works">
              <h3 className="how-it-works__title">How it works</h3>
              <div className="how-it-works__steps">
                {steps.map((step, i) => (
                  <div className="how-it-works__step" key={i}>
                    <div className="how-it-works__step-icon">{step.icon}</div>
                    <div className="how-it-works__step-content">
                      <h4>{step.title}</h4>
                      <p>{step.desc}</p>
                    </div>
                    {i < steps.length - 1 && <div className="how-it-works__step-line" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="upload-info-card">
              <p className="upload-info-card__label">Supported Formats</p>
              <p>📄 CSV (.csv)</p>
              <p>📊 Excel (.xlsx, .xls)</p>
              <p style={{ marginTop: 12 }} className="upload-info-card__label">Requirements</p>
              <p>📏 Max file size: 50MB</p>
              <p>📋 Required columns: Amount, Description, Date</p>
              <p>🔒 No sensitive data (use hashed identifiers)</p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
