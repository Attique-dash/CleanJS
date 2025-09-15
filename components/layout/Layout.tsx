// components/layout/Layout.tsx
'use client'

import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

type Props = React.PropsWithChildren<{ sidebar?: React.ReactNode }>

export default function Layout({ sidebar, children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-stretch gap-6">
          {sidebar && (
            <div className="hidden lg:block">
              {sidebar}
            </div>
          )}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}


