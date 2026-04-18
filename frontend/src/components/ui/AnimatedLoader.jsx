import React from 'react'

export default function AnimatedLoader({ text = 'Loading...' }) {
  return (
    <div className="animated-loader">
      <div className="animated-loader__spinner" />
      <p className="animated-loader__text">{text}</p>
    </div>
  )
}
