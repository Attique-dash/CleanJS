// components/ui/LoadingSpinner.tsx
'use client'

export default function LoadingSpinner() {
  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
    </div>
  )
}


