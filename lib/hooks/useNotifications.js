'use client'

import { useEffect, useState, useCallback } from 'react'

export default function useNotifications() {
  const [items, setItems] = useState([])

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/admin/reports', { cache: 'no-store' })
    const json = await res.json()
    setItems(json.notifications || [])
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  return { items, refresh: fetchItems }
}


