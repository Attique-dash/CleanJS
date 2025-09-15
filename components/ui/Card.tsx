// components/ui/Card.tsx
'use client'

import React from 'react'

type Props = React.PropsWithChildren<{
  className?: string
}>

export default function Card({ className = '', children }: Props) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  )
}


