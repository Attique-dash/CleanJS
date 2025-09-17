'use client'

import { useState, useCallback } from 'react'

export default function usePackages() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const create = useCallback(async (payload) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/packages', { method: 'POST', body: JSON.stringify(payload) })
      return await res.json()
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading, error }
}


