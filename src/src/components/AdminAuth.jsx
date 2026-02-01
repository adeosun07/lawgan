import { useState } from 'react'
import axios from 'axios'
import styles from '../styles/AdminAuth.module.css'

const API_BASE_URL = import.meta.env.VITE_BACKEND_API

function AdminAuth({ onAuthSuccess }) {
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSignupChange = (e) => {
    const { name, value } = e.target
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/signin`, loginData)
      
      localStorage.setItem('adminToken', response.data.token)
      setMessage({ type: 'success', text: 'Login successful!' })
      
      setTimeout(() => {
        onAuthSuccess()
      }, 500)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (signupData.password !== signupData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      setLoading(false)
      return
    }

    if (signupData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' })
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/signup`, {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password
      })
      
      setMessage({ type: 'success', text: 'Account created successfully! Please log in.' })
      
      setTimeout(() => {
        setIsLogin(true)
      }, 500)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Signup failed. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <h1>{isSignupMode ? 'Admin Sign Up' : 'Admin Login'}</h1>
        <p>{isSignupMode ? 'Create an admin account' : 'Sign in to manage articles'}</p>

        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {isSignupMode ? (
          <form onSubmit={handleSignup} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={signupData.name}
                onChange={handleSignupChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  placeholder="Enter your password (min. 6 characters)"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.authBtn} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div className={styles.toggleMode}>
              <p>
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsSignupMode(false)
                    setMessage({ type: '', text: '' })
                  }}
                  className={styles.toggleLink}
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.authBtn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className={styles.toggleMode}>
              <p>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsSignupMode(true)
                    setMessage({ type: '', text: '' })
                  }}
                  className={styles.toggleLink}
                >
                  Sign Up
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AdminAuth
