// components/packages/PackageStatus.tsx
'use client'

import Badge from '../ui/badge'

type Props = {
  status: number
  statusName: string
}

export default function PackageStatus({ status, statusName }: Props) {
  const variant = status === 4 ? 'success' : status === 0 ? 'warning' : 'info'
  return <Badge variant={variant as any}>{statusName}</Badge>
}