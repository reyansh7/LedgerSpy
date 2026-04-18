import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar'
import Sidebar from '../Sidebar'

export default function AppLayout() {
  return (
    <div className="app">
      <Navbar />
      <div className="app-container">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  )
}
