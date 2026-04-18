import React, { useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
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
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40"
    >
      <label className="mb-2 block text-sm font-medium text-slate-200">Upload transaction CSV</label>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".csv"
        disabled={loading}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
      />
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      <button
        type="submit"
        disabled={loading || !file}
        className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
      >
        {loading ? 'Analyzing...' : 'Upload and Analyze'}
      </button>
    </motion.form>
  )
}
