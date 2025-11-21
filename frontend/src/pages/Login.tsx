import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as api from '../api'
import extractErrorMessage from '../utils/extractErrorMessage'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignup, setShowSignup] = useState(false)
  // Signup fields
  const [suUsername, setSuUsername] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suLevel, setSuLevel] = useState('level3')
  const [suError, setSuError] = useState<string | null>(null)
  const [suSuccess, setSuSuccess] = useState<string | null>(null)
  const auth = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await auth.login(username, password)
      navigate('/dashboard')
    } catch (err: unknown) {
  setError(extractErrorMessage(err) || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  const validatePassword = (p: string) => {
    // At least one uppercase, one digit, one special char (excluding space and underscore), min 8 chars
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\s_]).{8,}$/
    return re.test(p)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setSuError(null)
    setSuSuccess(null)

    if (!/^[^\s]+$/.test(suUsername)) return setSuError('Username must not contain spaces')
    if (!validatePassword(suPassword)) return setSuError('Password must be at least 8 chars, include uppercase, number and special char (no spaces or _ )')
    if (!/^[^\s]+@[^\s]+\.[^\s]+$/.test(suEmail)) return setSuError('Invalid email')

    try {
      const res = await api.signup({ username: suUsername, password: suPassword, name: suName, userLevel: suLevel, email: suEmail })
      if (res.isApproved === false) {
        setSuSuccess('Account created — pending admin approval')
      } else {
        setSuSuccess('Account created — you may now log in')
      }
      setSuUsername(''); setSuPassword(''); setSuName(''); setSuEmail(''); setSuLevel('level3')
    } catch (err: unknown) {
      setSuError(extractErrorMessage(err))
    }
  }

  return (
    <div className="card auth-card">
      <h2>Sign in</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Signing...' : 'Sign in'}</button>
      </form>
      <div className="hint"><strong>Need an account? Create one below</strong></div>
      <hr />
      <button className="btn" onClick={() => setShowSignup(!showSignup)}>{showSignup ? 'Hide register' : 'Create account'}</button>

      {showSignup && (
        <div className="signup">
          <h3>Create account</h3>
          <form onSubmit={handleSignup} className="form">
            <label>
              Username
              <input value={suUsername} onChange={(e) => setSuUsername(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required />
            </label>
            <label>
              Full name
              <input value={suName} onChange={(e) => setSuName(e.target.value)} />
            </label>
            <label>
              Email
              <input type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required />
            </label>
            <label>
              Access Level
              <select value={suLevel} onChange={(e) => setSuLevel(e.target.value)}>
                <option value="admin">Admin / Super admin</option>
                <option value="level1">Level 1</option>
                <option value="level2">Level 2</option>
                <option value="level3">Level 3</option>
              </select>
            </label>
            {suError && <div className="error">{suError}</div>}
            {suSuccess && <div className="success">{suSuccess}</div>}
            <button type="submit" className="btn">Register</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Login
