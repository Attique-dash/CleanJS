// components/tracking/TrackingResult.tsx
'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'
import TrackingDisplay from '../packages/TrackingDisplay'
import StatusTimeline from './StatusTimeline'

type PackageData = {
  trackingNumber: string
  status: number
  statusName: string
  branch: string
  lastUpdated: string
  statusHistory: Array<{ status: number; timestamp: string; location?: string; notes?: string }>
}

type Props = { trackingNumber: string }

export default function TrackingResult({ trackingNumber }: Props) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PackageData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/packages/tracking/${encodeURIComponent(trackingNumber)}`, { cache: 'no-store' })
        const json = await res.json()
        if (json.success && json.package) {
          setData({
            trackingNumber: json.package.trackingNumber,
            status: json.package.packageStatus,
            statusName: json.package.statusName,
            branch: json.package.branch,
            lastUpdated: json.package.entryDateTime,
            statusHistory: json.package.statusHistory || []
          })
        } else {
          setData(null)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [trackingNumber])

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="text-sm text-gray-500">Package not found.</div>

  return (
    <div className="space-y-4">
      <TrackingDisplay {...data} />
      <StatusTimeline items={data.statusHistory} />
    </div>
  )
}


