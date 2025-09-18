// components/ui/badge.tsx
'use client'

import React from 'react'

type Variant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  size?: Size
  className?: string
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  destructive: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  outline: 'text-foreground border border-input',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
    >
      {children}
    </span>
  )
}
