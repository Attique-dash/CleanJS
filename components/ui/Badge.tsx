// components/ui/Badge.tsx
'use client'

import React from 'react'

type Variant = 'info' | 'success' | 'warning' | 'danger'

const variantClasses: Record<Variant, string> = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800'
}

type Props = React.PropsWithChildren<{ variant?: Variant }>

export default function Badge({ variant = 'info', children }: Props) {
  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}


