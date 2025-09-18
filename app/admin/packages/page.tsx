// app/admin/packages/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import Badge from '../../../components/ui/badge'

interface Package {
  _id: string
  trackingNumber: string
  controlNumber: string
  userCode: string
  customerName: string
  shipper: string
  weight: number
  status: number
  statusName: string
  branch: string
  entryDateTime: string
  description?: string
}

export default function PackagesPage() {
  const router = useRouter()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reports?limit=100')
      const result = await response.json()
      
      if (result.success) {
        setPackages(result.data.rows.map((pkg: any) => ({
          _id: pkg._id || pkg.trackingNumber,
          trackingNumber: pkg.trackingNumber,
          controlNumber: pkg.controlNumber,
          userCode: pkg.userCode,
          customerName: pkg.customerName || 'Unknown',
          shipper: pkg.shipper || 'Unknown',
          weight: pkg.weight || 0,
          status: pkg.status || 0,
          statusName: pkg.statusName || 'AT WAREHOUSE',
          branch: pkg.branch || 'Unknown',
          entryDateTime: pkg.entryDateTime || new Date().toISOString(),
          description: pkg.description
        })))
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = 
      pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.controlNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.userCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.shipper.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || pkg.status.toString() === statusFilter
    const matchesBranch = branchFilter === 'all' || pkg.branch === branchFilter

    return matchesSearch && matchesStatus && matchesBranch
  })

  const getStatusColor = (status: number) => {
    const statusColors: Record<number, string> = {
      0: 'warning',   // AT WAREHOUSE
      1: 'info',      // DELIVERED TO AIRPORT
      2: 'info',      // IN TRANSIT TO LOCAL PORT
      3: 'info',      // AT LOCAL PORT
      4: 'success'    // AT LOCAL SORTING
    }
    return statusColors[status] || 'info'
  }

  const getStatusName = (status: number) => {
    const statusNames: Record<number, string> = {
      0: 'AT WAREHOUSE',
      1: 'DELIVERED TO AIRPORT',
      2: 'IN TRANSIT TO LOCAL PORT',
      3: 'AT LOCAL PORT',
      4: 'AT LOCAL SORTING'
    }
    return statusNames[status] || 'UNKNOWN'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all packages in the system</p>
        </div>
        <Button onClick={() => router.push('/admin/packages/new')}>
          Add New Package
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Packages</p>
              <p className="text-2xl font-semibold text-gray-900">{packages.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">At Warehouse</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {packages.filter(p => p.status === 0).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-semibold text-blue-600">
                {packages.filter(p => p.status >= 1 && p.status <= 3).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">At Local Sorting</p>
              <p className="text-2xl font-semibold text-green-600">
                {packages.filter(p => p.status === 4).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="0">At Warehouse</option>
              <option value="1">Delivered to Airport</option>
              <option value="2">In Transit to Local Port</option>
              <option value="3">At Local Port</option>
              <option value="4">At Local Sorting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              <option value="Main">Main Branch</option>
              <option value="Down Town">Downtown</option>
              <option value="Airport">Airport</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="secondary"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setBranchFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Package List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Control Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipper
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPackages.map((pkg) => (
                <tr key={pkg._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {pkg.trackingNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm">
                      {pkg.controlNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {pkg.customerName}
                      </div>
                      <div className="text-sm text-gray-500">{pkg.userCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.shipper}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.weight} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(pkg.status) as any}>
                      {getStatusName(pkg.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.branch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pkg.entryDateTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/admin/packages/${pkg._id}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/admin/packages/${pkg._id}/edit`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No packages found</div>
            <Button onClick={() => router.push('/admin/packages/new')}>
              Add First Package
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
