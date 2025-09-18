// components/ui/Button.tsx
'use client'

import React from 'react'

type Variant = 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
type Size = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white',
  outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
  ghost: 'hover:bg-gray-100 text-gray-900',
  link: 'text-blue-600 hover:text-blue-700 underline',
  destructive: 'bg-red-600 hover:bg-red-700 text-white'
}

const sizeClasses: Record<Size, string> = {
  default: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2'
}

export default function Button({ 
  variant = 'default', 
  size = 'default', 
  className = '', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md font-medium 
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...props}
    />
  )
}

// Named export for backward compatibility
export { Button }