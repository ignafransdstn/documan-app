import React, { createContext, useEffect, useState } from 'react'
import * as api from '../api'
import type { ApiUser, LoginResponse } from '../api'

export type AuthContextType = {
  token: string | null
  user: ApiUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<ApiUser | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as ApiUser) : null
  })

  // Auto-logout setelah 1 jam tidak aktif
  useEffect(() => {
    if (!token || !user) return

    const INACTIVITY_TIMEOUT = 60 * 60 * 1000 // 1 jam dalam milidetik
    let inactivityTimer: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      localStorage.setItem('lastActivity', Date.now().toString())
      
      inactivityTimer = setTimeout(() => {
        // Auto logout setelah 1 jam tidak aktif
        console.log('Session expired due to inactivity')
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('lastActivity')
        alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 1 jam. Silakan login kembali.')
      }, INACTIVITY_TIMEOUT)
    }

    // Event listener untuk tracking aktivitas user
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      resetTimer()
    }

    // Set timer awal
    resetTimer()

    // Attach event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer)
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [token, user])

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  async function login(username: string, password: string) {
    const res = await api.login(username, password) as LoginResponse
    // expected res to contain token and user info
    setToken(res.token || null)
    setUser({ id: res.id, username: res.username, email: res.email, userLevel: res.userLevel })
    localStorage.setItem('lastActivity', Date.now().toString())
  }

  function logout() {
    // Call API logout jika ada token
    if (token) {
      api.logout(token).catch(err => {
        console.error('Logout API error:', err)
      })
    }
    
    setToken(null)
    setUser(null)
    localStorage.removeItem('lastActivity')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
  )
}

// Intentionally do not export the hook from this file to keep this module a single component export
export { AuthContext }
export default AuthProvider
