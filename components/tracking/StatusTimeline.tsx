// components/tracking/StatusTimeline.tsx
'use client'

type Item = { status: number; timestamp: string; location?: string; notes?: string }

type Props = { items: Item[] }

const statusNames: Record<number, string> = {
  0: 'At Warehouse',
  1: 'Delivered to Airport',
  2: 'In Transit',
  3: 'At Local Port',
  4: 'At Local Sorting'
}

export default function StatusTimeline({ items }: Props) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-gray-500">No history</div>
  }
  return (
    <ol className="relative border-l border-gray-200 pl-4">
      {items.slice().reverse().map((it, idx) => (
        <li key={idx} className="mb-4 ml-2">
          <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-1.5 border border-white" />
          <time className="mb-1 text-xs font-normal leading-none text-gray-400">{new Date(it.timestamp).toLocaleString()}</time>
          <h3 className="text-sm font-semibold text-gray-900">{statusNames[it.status] || `Status ${it.status}`}</h3>
          <p className="text-sm text-gray-700">{it.location || ''}{it.location && it.notes ? ' • ' : ''}{it.notes || ''}</p>
        </li>
      ))}
    </ol>
  )
}


