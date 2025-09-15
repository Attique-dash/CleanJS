// components/layout/Footer.tsx
'use client'

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
        <span>© {new Date().getFullYear()} CleanJS Logistics</span>
        <span>Built with Next.js + Tailwind</span>
      </div>
    </footer>
  )
}


