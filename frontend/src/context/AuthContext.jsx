import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false)
    apiFetch('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  async function saveTokenAndLoadUser(token) {
    localStorage.setItem('token', token)
    setUser(await apiFetch('/auth/me'))
  }

  async function login(username, password) {
    const body = new URLSearchParams({ username, password })
    const { access_token } = await apiFetch('/auth/login', { method: 'POST', body })
    await saveTokenAndLoadUser(access_token)
  }

  async function register(email, username, password) {
    const { access_token } = await apiFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    })
    await saveTokenAndLoadUser(access_token)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)