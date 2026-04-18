import React, { useContext, useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import Navbar from '../Navbar'
import Sidebar from '../Sidebar'
import { AppContext } from '../../context/AppContext'

export default function ProtectedLayout() {
  const navigate = useNavigate()
  const { user, setUser } = useContext(AppContext)

  useEffect(() => {
    // Check for auth token in localStorage
    const token = localStorage.getItem('token')
    
    if (!token && !user) {
      // No token and no user in context, redirect to login
      navigate('/login', { replace: true })
      return
    }

    // Optionally verify token validity (if backend provides token validation)
    // For now, just trusting localStorage.token exists
  }, [user, navigate, setUser])

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
