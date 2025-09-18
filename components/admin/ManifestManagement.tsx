// components/admin/ManifestManagement.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/input'
import Button from '../ui/Button'
import Table from '../ui/Table'

interface ManifestRow {
  manifestID: string
  manifestCode: string
  serviceTypeName: string
  statusName: string
  weight: number
  itemCount: number
  flightDate: string
}

export default function ManifestManagement() {
  const [manifests, setManifests] = useState<ManifestRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return manifests
    return manifests.filter(m =>
      m.manifestID.toLowerCase().includes(q) ||
      m.manifestCode.toLowerCase().includes(q) ||
      m.serviceTypeName.toLowerCase().includes(q) ||
      m.statusName.toLowerCase().includes(q)
    )
  }, [manifests, query])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tasoko/manifest?limit=100', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setManifests(data.manifests.map((m: any) => ({
        manifestID: m.ManifestID,
        manifestCode: m.ManifestCode,
        serviceTypeName: m.ServiceTypeName,
        statusName: m.StatusName,
        weight: m.Weight,
        itemCount: m.ItemCount,
        flightDate: m.FlightDate
      })))
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <Input placeholder="Search manifests..." value={query} onChange={(e: any) => setQuery(e.target.value)} />
        <Button onClick={load} className="ml-3">Refresh</Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <thead>
            <tr>
              <th>Manifest Code</th>
              <th>Service</th>
              <th>Status</th>
              <th>Flight Date</th>
              <th>Items</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.manifestID}>
                <td>{m.manifestCode}</td>
                <td>{m.serviceTypeName}</td>
                <td>{m.statusName}</td>
                <td>{new Date(m.flightDate).toLocaleDateString()}</td>
                <td>{m.itemCount}</td>
                <td>{m.weight} kg</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-sm text-gray-500 p-6">No manifests</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}


