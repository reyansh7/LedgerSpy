/**
 * Helper utility functions for frontend
 */

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatPercentage = (value) => {
  return `${(value * 100).toFixed(2)}%`
}

export const getStatusColor = (status) => {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  }
  return colors[status] || '#6b7280'
}

export const truncateText = (text, length = 50) => {
  return text.length > length ? `${text.substring(0, length)}...` : text
}
