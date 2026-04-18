import React, { useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MdCloudUpload } from 'react-icons/md'
import { uploadFile } from '../services/api'
import { AppContext } from '../context/AppContext'

export default function FileUpload() {
  const navigate = useNavigate()
  const { setUploadedFile, setResultsData } = useContext(AppContext)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setError(null)
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

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="glass-card slide-in"
    >
      <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
        Upload transaction CSV
      </label>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".csv"
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-input)',
          color: 'var(--text-primary)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
        }}
      />
      {error && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--accent-red)' }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !file}
        className="btn-primary"
        style={{
          marginTop: '1.5rem',
          width: '100%',
          opacity: loading || !file ? 0.5 : 1,
          cursor: loading || !file ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '⏳ Analyzing...' : '📤 Upload and Analyze'}
      </button>
    </motion.form>
  )
}
