// components/admin/PackageManagement.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/input'
import Button from '../ui/Button'
import Table from '../ui/Table'
import Modal from '../ui/Modal'

interface Pkg {
  _id: string
  trackingNumber: string
  controlNumber: string
  userCode: string
  customerName?: string
  branch: string
  weight: number
  status: number
  statusName: string
}

export default function PackageManagement() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Pkg | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return packages
    return packages.filter(p =>
      p.trackingNumber.toLowerCase().includes(q) ||
      p.controlNumber.toLowerCase().includes(q) ||
      p.userCode.toLowerCase().includes(q) ||
      (p.customerName || '').toLowerCase().includes(q) ||
      p.branch.toLowerCase().includes(q)
    )
  }, [packages, query])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/reports?limit=100')
      const data = await res.json()
      if (data.success) setPackages(data.data.rows.map((r: any) => ({
        _id: r._id || r.trackingNumber,
        trackingNumber: r.trackingNumber,
        controlNumber: r.controlNumber,
        userCode: r.userCode,
        customerName: r.customerName,
        branch: r.branch,
        weight: r.weight,
        status: r.status,
        statusName: r.statusName
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
        <Input placeholder="Search packages..." value={query} onChange={(e: any) => setQuery(e.target.value)} />
        <Button onClick={load} className="ml-3">Refresh</Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Control</th>
              <th>UserCode</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Weight</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p._id}>
                <td>{p.trackingNumber}</td>
                <td>{p.controlNumber}</td>
                <td>{p.userCode}</td>
                <td>{p.customerName || '-'}</td>
                <td>{p.branch}</td>
                <td>{p.weight} kg</td>
                <td>{p.statusName}</td>
                <td className="text-right">
                  <Button size="sm" onClick={() => setSelected(p)}>View</Button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-sm text-gray-500 p-6">No packages</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Package Details">
        {selected && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">Tracking:</span> {selected.trackingNumber}</div>
              <div><span className="text-gray-500">Control:</span> {selected.controlNumber}</div>
              <div><span className="text-gray-500">UserCode:</span> {selected.userCode}</div>
              <div><span className="text-gray-500">Customer:</span> {selected.customerName || '-'}</div>
              <div><span className="text-gray-500">Branch:</span> {selected.branch}</div>
              <div><span className="text-gray-500">Weight:</span> {selected.weight} kg</div>
              <div><span className="text-gray-500">Status:</span> {selected.statusName}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}


