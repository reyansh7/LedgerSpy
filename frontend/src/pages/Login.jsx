import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const orb1Ref = useRef(null)
  const orb2Ref = useRef(null)

  useEffect(() => {
    // Card entrance
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 50, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
    )

    // Floating orbs
    gsap.to(orb1Ref.current, {
      x: 30, y: -20, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut'
    })
    gsap.to(orb2Ref.current, {
      x: -25, y: 25, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut'
    })

    // Parallax on mouse move
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      gsap.to(orb1Ref.current, { x: x * 2, y: y * 2, duration: 1, ease: 'power2.out' })
      gsap.to(orb2Ref.current, { x: -x * 1.5, y: -y * 1.5, duration: 1, ease: 'power2.out' })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setCredentials(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Simulate login
    setTimeout(() => {
      localStorage.setItem('token', 'demo-token')
      navigate('/')
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="login-page">
      <div className="login-page__bg-orb login-page__bg-orb--1" ref={orb1Ref}></div>
      <div className="login-page__bg-orb login-page__bg-orb--2" ref={orb2Ref}></div>

      <div className="login-card" ref={cardRef}>
        <div className="login-card__logo">
          <div className="login-card__logo-icon">LS</div>
          <span className="login-card__logo-text">LedgerSpy</span>
        </div>

        <h2 className="login-card__title">Welcome Back</h2>
        <p className="login-card__subtitle">Sign in to your account to continue</p>

        <form className="login-card__form" onSubmit={handleSubmit}>
          <div className="login-card__field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="username"
              placeholder="you@example.com"
              value={credentials.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="login-card__field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="login-card__error">{error}</div>}

          <button type="submit" className="login-card__submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
