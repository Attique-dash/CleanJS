// components/ui/select.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface SelectValueProps {
  placeholder?: string
}

export function Select({ value, onValueChange, children, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child, { 
              onClick: () => setIsOpen(!isOpen),
              isOpen 
            } as any)
          }
          if (child.type === SelectContent && isOpen) {
            return React.cloneElement(child, { 
              onValueChange: (val: string) => {
                onValueChange(val)
                setIsOpen(false)
              }
            } as any)
          }
        }
        return child
      })}
    </div>
  )
}

export function SelectTrigger({ children, className = '', onClick, isOpen }: SelectTriggerProps & { onClick?: () => void, isOpen?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-between w-full px-3 py-2 text-sm 
        border border-gray-300 rounded-md bg-white hover:bg-gray-50 
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
    >
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  )
}

export function SelectContent({ children, className = '', onValueChange }: SelectContentProps & { onValueChange?: (value: string) => void }) {
  return (
    <div className={`
      absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg
      max-h-60 overflow-auto
      ${className}
    `}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, { 
            onClick: () => onValueChange?.(child.props.value)
          } as any)
        }
        return child
      })}
    </div>
  )
}

export function SelectItem({ value, children, className = '', onClick }: SelectItemProps & { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full px-3 py-2 text-left text-sm hover:bg-gray-100 
        focus:outline-none focus:bg-gray-100
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span className="text-gray-500">{placeholder}</span>
}
