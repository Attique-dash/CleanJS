// components/ui/Input.tsx
'use client'

import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export default function Input(props: Props) {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${props.className || ''}`}
      {...props}
    />
  )
}


