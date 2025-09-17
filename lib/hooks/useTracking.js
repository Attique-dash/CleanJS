'use client'

import { useCallback, useState } from 'react'

export default function useTracking() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const fetchTracking = useCallback(async (trackingNumber) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/packages/tracking/${encodeURIComponent(trackingNumber)}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.package) setData(json.package)
      else setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, data, fetchTracking }
}


