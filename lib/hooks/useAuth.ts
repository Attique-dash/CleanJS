'use client'

import { useEffect, useState, useCallback } from 'react'

interface User {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'admin';
  isActive: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/status', { cache: 'no-store' })
      const json: AuthResponse = await res.json()
      setUser(json.user || null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const res = await fetch('/api/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) 
    })
    const json: AuthResponse = await res.json()
    if (json.success) await refresh()
    return json
  }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/sync', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }) 
    })
    await refresh()
  }, [refresh])

  return { user, loading, login, logout, refresh }
}

export default useAuth


