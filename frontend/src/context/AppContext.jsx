import React, { createContext, useState } from 'react'

export const AppContext = createContext()

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [files, setFiles] = useState([])
  const [notifications, setNotifications] = useState([])

  const addNotification = (message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  const value = {
    user,
    setUser,
    files,
    setFiles,
    notifications,
    addNotification,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
