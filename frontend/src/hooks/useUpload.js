import { useState } from 'react'
import { uploadFile } from '../services/api'

export default function useUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const upload = async (file) => {
    setLoading(true)
    setError(null)
    try {
      const response = await uploadFile(file)
      setData(response.data)
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Upload failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { upload, loading, error, data }
}
