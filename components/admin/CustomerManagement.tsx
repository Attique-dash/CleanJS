// components/admin/CustomerManagement.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/input'
import Button from '../ui/Button'
import Table from '../ui/Table'

interface Customer {
  _id: string
  userCode: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  branch: string
  isActive: boolean
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(c =>
      c.userCode.toLowerCase().includes(q) ||
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      c.branch.toLowerCase().includes(q)
    )
  }, [customers, query])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (data.success) setCustomers(data.customers)
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
        <Input placeholder="Search customers..." value={query} onChange={(e: any) => setQuery(e.target.value)} />
        <Button onClick={load} className="ml-3">Refresh</Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <thead>
            <tr>
              <th>UserCode</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c._id}>
                <td>{c.userCode}</td>
                <td>{c.firstName} {c.lastName}</td>
                <td>{c.email || '-'}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.branch}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-sm text-gray-500 p-6">No customers</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}