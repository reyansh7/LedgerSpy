import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function DataTable({ title, columns, data, footer, actions }) {
  const tableRef = useRef(null)

  useEffect(() => {
    if (!tableRef.current) return
    const rows = tableRef.current.querySelectorAll('tbody tr')
    gsap.fromTo(rows,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
    )
  }, [data])

  return (
    <div className="data-table-wrapper" ref={tableRef}>
      {(title || actions) && (
        <div className="data-table-wrapper__header">
          <h3 className="data-table-wrapper__title">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? data.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row, idx) : row[col.key]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {footer && <div className="data-table__footer">{footer}</div>}
    </div>
  )
}
