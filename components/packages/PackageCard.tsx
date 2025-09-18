// components/packages/PackageCard.tsx
'use client'

import { Card } from '../ui/card'
import Badge from '../ui/badge'

type Props = {
  trackingNumber: string
  controlNumber: string
  customerName: string
  weight: number
  branch: string
  statusName: string
}

export default function PackageCard({ trackingNumber, controlNumber, customerName, weight, branch, statusName }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{trackingNumber}</h4>
          <p className="text-xs text-gray-500">Control: {controlNumber}</p>
          <p className="text-sm text-gray-700 mt-1">{customerName}</p>
          <p className="text-xs text-gray-500">{branch}</p>
        </div>
        <div className="text-right">
          <Badge>{statusName}</Badge>
          <p className="text-sm text-gray-700 mt-2">{weight} kg</p>
        </div>
      </div>
    </Card>
  )
}
