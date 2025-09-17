'use client'

import { useEffect, useState, useCallback } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/status', { cache: 'no-store' })
      const json = await res.json()
      setUser(json.user || null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = useCallback(async (payload) => {
    const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) })
    const json = await res.json()
    if (json.success) await refresh()
    return json
  }, [refresh])

  const logout = useCallback(async () => {
    await fetch('/api/auth/sync', { method: 'POST', body: JSON.stringify({ action: 'logout' }) })
    await refresh()
  }, [refresh])

  return { user, loading, login, logout, refresh }
}

export default useAuth


