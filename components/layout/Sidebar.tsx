// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full p-4 space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Navigation</h3>
      <nav className="space-y-1">
        <Link href="/admin" className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700">Overview</Link>
        <Link href="/admin/customers" className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700">Customers</Link>
        <Link href="/admin/packages" className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700">Packages</Link>
        <Link href="/admin/manifests" className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700">Manifests</Link>
        <Link href="/admin/reports" className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700">Reports</Link>
        <Link href="/admin/settings" className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700">Settings</Link>
      </nav>
    </aside>
  )
}


