import React from 'react'

export default function Toggle({ label, active, onChange }) {
  return (
    <div className="toggle" onClick={() => onChange && onChange(!active)}>
      <div className={`toggle__track ${active ? 'toggle__track--active' : ''}`}>
        <div className="toggle__thumb" />
      </div>
      {label && <span className="toggle__label">{label}</span>}
    </div>
  )
}
