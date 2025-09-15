// components/ui/Modal.tsx
'use client'

import React from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: Props) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}


