// components/admin/ReportsPanel.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Card from '../ui/Card'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface ReportSummary {
  totalPackages: number
  totalWeight: number
  avgWeight: number
  branches: Array<{
    name: string
    packages: number
    weight: number
  }>
}

interface ReportRow {
  trackingNumber: string
  controlNumber: string
  userCode: string
  customerName: string
  shipper: string
  branch: string
  weight: number
  status: number
  statusName: string
  entryDateTime: string
}

export default function ReportsPanel() {
  const [from, setFrom] = useState<string>(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [branch, setBranch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [query, setQuery] = useState<string>('')

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.trackingNumber.toLowerCase().includes(q) ||
      r.controlNumber.toLowerCase().includes(q) ||
      r.userCode.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.shipper.toLowerCase().includes(q) ||
      r.branch.toLowerCase().includes(q)
    )
  }, [rows, query])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('from', from)
      params.append('to', to)
      if (branch) params.append('branch', branch)

      const res = await fetch(`/api/admin/reports?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setSummary(data.data.summary)
        setRows(data.data.rows)
      } else {
        setSummary({ totalPackages: 0, totalWeight: 0, avgWeight: 0, branches: [] })
        setRows([])
      }
    } catch (e) {
      console.error('Failed to load reports', e)
      setSummary({ totalPackages: 0, totalWeight: 0, avgWeight: 0, branches: [] })
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <Input type="date" value={from} onChange={(e: any) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <Input type="date" value={to} onChange={(e: any) => setTo(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Branch</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="">All Branches</option>
              <option value="Main">Main</option>
              <option value="Down Town">Down Town</option>
              <option value="Airport">Airport</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchReports}>Run</Button>
          </div>
        </div>
      </Card>

      {loading && <LoadingSpinner />}

      {!loading && summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Packages</p>
            <p className="text-2xl font-semibold">{summary.totalPackages.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Weight</p>
            <p className="text-2xl font-semibold">{summary.totalWeight.toLocaleString()} kg</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Avg Weight</p>
            <p className="text-2xl font-semibold">{summary.avgWeight.toLocaleString()} kg</p>
          </Card>
        </div>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Packages</h3>
          <Input placeholder="Search..." value={query} onChange={(e: any) => setQuery(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UserCode</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipper</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entered</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRows.map(row => (
                <tr key={row.trackingNumber}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.trackingNumber}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.controlNumber}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.userCode}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.customerName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.shipper}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.branch}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.weight} kg</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.statusName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(row.entryDateTime).toLocaleString()}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}


