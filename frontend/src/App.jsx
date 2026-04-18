import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Results from './pages/Results'
import ExplainAI from './pages/ExplainAI'
import Reports from './pages/Reports'
import History from './pages/History'
import Settings from './pages/Settings'
import Login from './pages/Login'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/upload" element={<AppLayout><Upload /></AppLayout>} />
        <Route path="/results" element={<AppLayout><Results /></AppLayout>} />
        <Route path="/explain" element={<AppLayout><ExplainAI /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
        <Route path="/history" element={<AppLayout><History /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
