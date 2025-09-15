// components/tracking/RealTimeUpdates.tsx
'use client'

import { useEffect, useState } from 'react'

type Update = { message: string; at: string }

type Props = { trackingNumber?: string }

export default function RealTimeUpdates({ trackingNumber }: Props) {
  const [updates, setUpdates] = useState<Update[]>([])

  useEffect(() => {
    let interval: any
    // Fallback: simple poll to simulate updates
    interval = setInterval(() => {
      setUpdates((u) => [{ message: 'Checking for updates...', at: new Date().toISOString() }, ...u].slice(0, 5))
    }, 10000)
    return () => clearInterval(interval)
  }, [trackingNumber])

  if (!trackingNumber) return null
  return (
    <div className="text-xs text-gray-500 space-y-1">
      {updates.map((u, idx) => (
        <div key={idx}>
          <span className="text-gray-400">{new Date(u.at).toLocaleTimeString()}:</span> {u.message}
        </div>
      ))}
    </div>
  )
}
