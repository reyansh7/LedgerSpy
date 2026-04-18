import React from 'react'
import FileUpload from '../components/FileUpload'

export default function Upload() {
  return (
    <div className="upload-page">
      <h1>Upload Financial Data</h1>
      <p>Upload a CSV or Excel file containing your financial transactions</p>
      <FileUpload />
      
      <div className="upload-info">
        <h3>Supported Formats:</h3>
        <ul>
          <li>CSV (.csv)</li>
          <li>Excel (.xlsx, .xls)</li>
        </ul>
        
        <h3>Requirements:</h3>
        <ul>
          <li>File size: Max 50MB</li>
          <li>Required columns: Amount, Description, Date</li>
          <li>No sensitive data (use hashed identifiers)</li>
        </ul>
      </div>
    </div>
  )
}
