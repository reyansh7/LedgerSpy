import React from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from '../Navbar'
import Sidebar from '../Sidebar'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <Topbar />
        <div className="app-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
