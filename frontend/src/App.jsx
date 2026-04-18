import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Results from './pages/Results'
import Login from './pages/Login'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <div className="app-container">
          <Sidebar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
