import React, { useContext, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdCloudUpload, MdCheckCircle, MdError } from 'react-icons/md'
import { uploadFile } from '../services/api'
import { AppContext } from '../context/AppContext'

export default function FileUpload() {
  const navigate = useNavigate()
  const { setUploadedFile, setResultsData } = useContext(AppContext)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    validateAndSetFile(selectedFile)
  }

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return
    
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }
    
    setFile(selectedFile)
    setError(null)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFile = e.dataTransfer?.files?.[0]
    validateAndSetFile(droppedFile)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    try {
      const response = await uploadFile(file)
      setUploadedFile(file)
      setResultsData(null)
      const fileId = response.data?.file_id
      if (!fileId) {
        throw new Error('Missing file id in upload response')
      }
      setFile(null)
      navigate(`/results?fileId=${encodeURIComponent(fileId)}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleClearFile = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="glass-card slide-in"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        border: dragActive ? '2px dashed var(--accent-purple)' : '1px solid var(--border-subtle)',
        backgroundColor: dragActive ? 'rgba(187, 92, 246, 0.1)' : undefined,
        transition: 'all var(--transition-base)',
        cursor: dragActive ? 'copy' : 'default'
      }}
    >
      <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Upload Transaction CSV
      </label>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '2rem',
              textAlign: 'center',
              border: `2px dashed ${dragActive ? 'var(--accent-purple)' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: dragActive ? 'rgba(187, 92, 246, 0.05)' : 'transparent',
              transition: 'all var(--transition-base)'
            }}
          >
            <MdCloudUpload style={{ fontSize: '3rem', color: 'var(--accent-purple)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Drag and drop your CSV file here
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              or click to browse
            </p>
            <button
              type="button"
              onClick={handleBrowseClick}
              className="btn-secondary"
              disabled={loading}
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              Browse Files
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: `1px solid var(--accent-green)`,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <MdCheckCircle style={{ fontSize: '2rem', color: 'var(--accent-green)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-white)', fontWeight: '600', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                {file.name}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {(file.size / 1024).toFixed(2)} KB • Ready to upload
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1.5rem',
                opacity: loading ? 0.5 : 0.7,
                transition: 'opacity var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".csv"
        disabled={loading}
        style={{ display: 'none' }}
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--accent-red)',
              fontSize: '0.875rem'
            }}
          >
            <MdError style={{ flexShrink: 0 }} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={loading || !file}
        className="btn-primary"
        whileHover={{ scale: loading || !file ? 1 : 1.02 }}
        whileTap={{ scale: loading || !file ? 1 : 0.98 }}
        style={{
          marginTop: '1.5rem',
          width: '100%',
          opacity: loading || !file ? 0.5 : 1,
          cursor: loading || !file ? 'not-allowed' : 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', marginRight: '0.5rem' }}
          >
            ⏳
          </motion.span>
        ) : (
          '📤'
        )}
        {loading ? ' Analyzing...' : ' Upload and Analyze'}
      </motion.button>
    </motion.form>
  )
}
