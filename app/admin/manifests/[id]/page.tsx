// app/admin/manifests/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Card } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'
import Badge from '../../../../components/ui/badge'

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
  Description?: string
}

interface ManifestPackage {
  _id: string
  trackingNumber: string
  controlNumber: string
  customerName: string
  userCode: string
  weight: number
  status: number
  statusName: string
  entryDateTime: string
}

export default function ManifestDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const manifestId = params.id as string
  
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [packages, setPackages] = useState<ManifestPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (manifestId) {
      fetchManifestDetails()
      fetchManifestPackages()
    }
  }, [manifestId])

  const fetchManifestDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasoko/manifest/${manifestId}`)
      const result = await response.json()
      
      if (result.success) {
        setManifest(result.manifest)
      }
    } catch (error) {
      console.error('Failed to fetch manifest details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManifestPackages = async () => {
    try {
      setPackagesLoading(true)
      const response = await fetch(`/api/tasoko/manifest/${manifestId}/packages`)
      const result = await response.json()
      
      if (result.success) {
        setPackages(result.packages)
      }
    } catch (error) {
      console.error('Failed to fetch manifest packages:', error)
    } finally {
      setPackagesLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'ACTIVE': 'success',
      'COMPLETED': 'info',
      'CANCELLED': 'error',
      'PENDING': 'warning'
    }
    return statusColors[status] || 'info'
  }

  const getPackageStatusColor = (status: number) => {
    const statusColors: Record<number, string> = {
      0: 'warning',   // AT WAREHOUSE
      1: 'info',      // DELIVERED TO AIRPORT
      2: 'info',      // IN TRANSIT TO LOCAL PORT
      3: 'info',      // AT LOCAL PORT
      4: 'success'    // AT LOCAL SORTING
    }
    return statusColors[status] || 'info'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!manifest) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Manifest not found</div>
        <Button onClick={() => router.push('/admin/manifests')}>
          Back to Manifests
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/admin/manifests')}
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {manifest.ManifestCode}
            </h1>
            <Badge variant={getStatusColor(manifest.StatusName) as any}>
              {manifest.StatusName}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">Manifest ID: {manifest.ManifestID}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/admin/manifests/${manifestId}/edit`)}
          >
            Edit Manifest
          </Button>
          <Button onClick={() => window.print()}>
            Print Manifest
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'packages', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manifest Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Manifest Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Manifest Code</label>
                <p className="font-mono text-gray-900">{manifest.ManifestCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Service Type</label>
                <Badge variant="info">
                  {manifest.ServiceTypeName}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge variant={getStatusColor(manifest.StatusName) as any}>
                  {manifest.StatusName}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Flight Date</label>
                <p className="text-gray-900">{new Date(manifest.FlightDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Branch</label>
                <p className="text-gray-900">{manifest.Branch}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-gray-900">{new Date(manifest.CreatedDate).toLocaleString()}</p>
              </div>
              {manifest.Description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {manifest.Description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Statistics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Manifest Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {manifest.ItemCount}
                </p>
                <p className="text-sm text-blue-600">Total Items</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {manifest.Weight} kg
                </p>
                <p className="text-sm text-green-600">Total Weight</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {packages.length}
                </p>
                <p className="text-sm text-purple-600">Loaded Packages</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {manifest.ItemCount - packages.length}
                </p>
                <p className="text-sm text-orange-600">Remaining</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'packages' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Manifest Packages ({packages.length})
              </h2>
              <Button
                variant="secondary"
                onClick={fetchManifestPackages}
                disabled={packagesLoading}
              >
                {packagesLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            {packagesLoading ? (
              <LoadingSpinner />
            ) : (
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
                        Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {packages.map((pkg) => (
                      <tr key={pkg._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm">
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
                          {pkg.weight} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getPackageStatusColor(pkg.status) as any}>
                            {pkg.statusName}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(pkg.entryDateTime).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(`/admin/packages/${pkg._id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {packages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No packages found for this manifest
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Manifest History
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Manifest Created</p>
                <p className="text-sm text-gray-500">
                  {new Date(manifest.CreatedDate).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Flight Scheduled</p>
                <p className="text-sm text-gray-500">
                  {new Date(manifest.FlightDate).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Current Status</p>
                <p className="text-sm text-gray-500">
                  {manifest.StatusName} - {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
