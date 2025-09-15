// app/admin/layout.tsx
import { ReactNode } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Navbar from '../../components/layout/Navbar'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}