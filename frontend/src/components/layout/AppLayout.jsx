import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      {/* Particle background orbs */}
      <div className="particle-bg">
        <div className="particle-bg__orb particle-bg__orb--1"></div>
        <div className="particle-bg__orb particle-bg__orb--2"></div>
        <div className="particle-bg__orb particle-bg__orb--3"></div>
      </div>

      <Sidebar />
      <div className="app-layout__main">
        <TopBar />
        <main className="app-layout__content">
          {children}
        </main>
      </div>
    </div>
  )
}
