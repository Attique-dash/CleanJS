// app/admin/layout.tsx
import { ReactNode } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Navbar from '../../components/layout/Navbar'

export const metadata = {
  title: 'Admin Dashboard - CleanJS Logistics',
  description: 'Administrative dashboard for managing customers, packages, and manifests',
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}