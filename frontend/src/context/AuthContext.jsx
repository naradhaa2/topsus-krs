import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [token, setToken]       = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('krs_token')
    if (!stored) { setIsLoading(false); return }

    setToken(stored)
    api.get('/api/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('krs_token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email, password, role) => {
    const res = await api.post('/api/auth/login', { email, password, role })
    const { access_token, user: userData } = res.data.data
    localStorage.setItem('krs_token', access_token)
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('krs_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
