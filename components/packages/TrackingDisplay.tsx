// components/packages/TrackingDisplay.tsx
'use client'

import Card from '../ui/Card'
import PackageStatus from './PackageStatus'

type Props = {
  trackingNumber: string
  status: number
  statusName: string
  branch: string
  lastUpdated: string
}

export default function TrackingDisplay({ trackingNumber, status, statusName, branch, lastUpdated }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{trackingNumber}</h4>
          <p className="text-xs text-gray-500">{branch}</p>
        </div>
        <div className="text-right">
          <PackageStatus status={status} statusName={statusName} />
          <p className="text-xs text-gray-500 mt-1">Updated {new Date(lastUpdated).toLocaleString()}</p>
        </div>
      </div>
    </Card>
  )
}
