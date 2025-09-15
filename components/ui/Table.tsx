// components/ui/Table.tsx
'use client'

import React from 'react'

type Props = React.PropsWithChildren<{}>

export default function Table({ children }: Props) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      {children}
    </table>
  )
}


