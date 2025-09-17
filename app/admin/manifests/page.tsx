// app/admin/manifests/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import Badge from '../../../components/ui/Badge'

interface Manifest {
  ManifestID: string
  ManifestCode: string
  ServiceTypeName: string
  StatusName: string
  Weight: number
  ItemCount: number
  FlightDate: string
  CreatedDate: string
  Branch: string
}

export default function ManifestsPage() {
  const router = useRouter()
  const [manifests, setManifests] = useState<Manifest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')

  useEffect(() => {
    fetchManifests()
  }, [])

  const fetchManifests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasoko/manifest?limit=100')
      const result = await response.json()
      
      if (result.success) {
        setManifests(result.manifests)
      }
    } catch (error) {
      console.error('Failed to fetch manifests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredManifests = manifests.filter(manifest => {
    const matchesSearch = 
      manifest.ManifestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manifest.ServiceTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manifest.StatusName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || manifest.StatusName === statusFilter
    const matchesService = serviceFilter === 'all' || manifest.ServiceTypeName === serviceFilter

    return matchesSearch && matchesStatus && matchesService
  })

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'ACTIVE': 'success',
      'COMPLETED': 'info',
      'CANCELLED': 'error',
      'PENDING': 'warning'
    }
    return statusColors[status] || 'info'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manifest Management</h1>
          <p className="text-gray-600 mt-1">Manage shipping manifests and flight schedules</p>
        </div>
        <Button onClick={() => router.push('/admin/manifests/new')}>
          Create New Manifest
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Manifests</p>
              <p className="text-2xl font-semibold text-gray-900">{manifests.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active Manifests</p>
              <p className="text-2xl font-semibold text-green-600">
                {manifests.filter(m => m.StatusName === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-blue-600">
                {manifests.reduce((sum, m) => sum + m.ItemCount, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="text-2xl font-semibold text-purple-600">
                {manifests.reduce((sum, m) => sum + m.Weight, 0)} kg
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
              placeholder="Search manifests..."
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
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Services</option>
              <option value="AIR STANDARD">Air Standard</option>
              <option value="AIR EXPRESS">Air Express</option>
              <option value="AIR PREMIUM">Air Premium</option>
              <option value="SEA STANDARD">Sea Standard</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="secondary"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setServiceFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Manifest List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manifest Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flight Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredManifests.map((manifest) => (
                <tr key={manifest.ManifestID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {manifest.ManifestCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="info">
                      {manifest.ServiceTypeName}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(manifest.StatusName) as any}>
                      {manifest.StatusName}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(manifest.FlightDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {manifest.ItemCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {manifest.Weight} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {manifest.Branch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/admin/manifests/${manifest.ManifestID}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/admin/manifests/${manifest.ManifestID}/edit`)}
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

        {filteredManifests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No manifests found</div>
            <Button onClick={() => router.push('/admin/manifests/new')}>
              Create First Manifest
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
