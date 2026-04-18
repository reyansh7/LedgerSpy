import React from 'react'

const statusMap = {
  completed: 'completed',
  processing: 'processing',
  failed: 'failed',
  normal: 'normal',
  'high-risk': 'high-risk',
  'high risk': 'high-risk',
  'medium-risk': 'medium-risk',
  'medium risk': 'medium-risk',
  'vendor-match': 'vendor-match',
  'vendor match': 'vendor-match',
  'unusual amount': 'high-risk',
  'benford deviation': 'medium-risk',
}

export default function StatusBadge({ status }) {
  const key = statusMap[status?.toLowerCase()] || 'normal'
  const display = status || 'Unknown'

  return (
    <span className={`status-badge status-badge--${key}`}>
      {display}
    </span>
  )
}
