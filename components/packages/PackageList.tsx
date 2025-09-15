// components/packages/PackageList.tsx
'use client'

import PackageCard from './PackageCard'

export type PackageListItem = {
  trackingNumber: string
  controlNumber: string
  customerName: string
  weight: number
  branch: string
  statusName: string
}

type Props = {
  items: PackageListItem[]
}

export default function PackageList({ items }: Props) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-gray-500">No packages</div>
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <PackageCard key={item.trackingNumber} {...item} />
      ))}
    </div>
  )
}
