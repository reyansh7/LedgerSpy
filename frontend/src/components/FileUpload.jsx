import React, { useState } from 'react'
import { uploadFile } from '../services/api'

export default function FileUpload() {
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
      console.log('Upload successful:', response.data)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls"
        disabled={loading}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading || !file}>
        {loading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  )
}
