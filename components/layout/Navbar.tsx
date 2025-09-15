// components/layout/Navbar.tsx
'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900">CleanJS Logistics</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
          <Link href="/admin" className="text-gray-700 hover:text-gray-900">Admin</Link>
          <Link href="/dashboard/tracking" className="text-gray-700 hover:text-gray-900">Tracking</Link>
        </div>
      </div>
    </nav>
  )
}


