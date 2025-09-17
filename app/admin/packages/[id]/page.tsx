// app/admin/packages/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Card from '../../../../components/ui/Card'
import Button from '../../../../components/ui/Button'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'
import Badge from '../../../../components/ui/Badge'

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
  hazmatCode?: string
  serviceType?: string
  destination?: string
  origin?: string
}

interface TrackingEvent {
  _id: string
  status: number
  statusName: string
  timestamp: string
  location: string
  notes?: string
}

export default function PackageDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const packageId = params.id as string
  
  const [pkg, setPkg] = useState<Package | null>(null)
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (packageId) {
      fetchPackageDetails()
      fetchTrackingEvents()
    }
  }, [packageId])

  const fetchPackageDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/packages/${packageId}`)
      const result = await response.json()
      
      if (result.success) {
        setPkg(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch package details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrackingEvents = async () => {
    try {
      setTrackingLoading(true)
      const response = await fetch(`/api/packages/tracking/${packageId}`)
      const result = await response.json()
      
      if (result.success) {
        setTrackingEvents(result.events)
      }
    } catch (error) {
      console.error('Failed to fetch tracking events:', error)
    } finally {
      setTrackingLoading(false)
    }
  }

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

  if (!pkg) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Package not found</div>
        <Button onClick={() => router.push('/admin/packages')}>
          Back to Packages
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
              onClick={() => router.push('/admin/packages')}
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {pkg.trackingNumber}
            </h1>
            <Badge variant={getStatusColor(pkg.status) as any}>
              {getStatusName(pkg.status)}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">Control Number: {pkg.controlNumber}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/admin/packages/${packageId}/edit`)}
          >
            Edit Package
          </Button>
          <Button onClick={() => window.print()}>
            Print Details
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'tracking', 'history'].map((tab) => (
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
          {/* Package Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Package Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                <p className="font-mono text-gray-900">{pkg.trackingNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Control Number</label>
                <p className="font-mono text-gray-900">{pkg.controlNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Customer</label>
                <p className="text-gray-900">{pkg.customerName} ({pkg.userCode})</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Shipper</label>
                <p className="text-gray-900">{pkg.shipper}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Weight</label>
                <p className="text-gray-900">{pkg.weight} kg</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge variant={getStatusColor(pkg.status) as any}>
                  {getStatusName(pkg.status)}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Branch</label>
                <p className="text-gray-900">{pkg.branch}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Entry Date</label>
                <p className="text-gray-900">{new Date(pkg.entryDateTime).toLocaleString()}</p>
              </div>
              {pkg.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {pkg.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Additional Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Details
            </h2>
            <div className="space-y-3">
              {pkg.hazmatCode && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Hazmat Code</label>
                  <Badge variant="warning">
                    {pkg.hazmatCode}
                  </Badge>
                </div>
              )}
              {pkg.serviceType && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Type</label>
                  <Badge variant="info">
                    {pkg.serviceType}
                  </Badge>
                </div>
              )}
              {pkg.origin && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Origin</label>
                  <p className="text-gray-900">{pkg.origin}</p>
                </div>
              )}
              {pkg.destination && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Destination</label>
                  <p className="text-gray-900">{pkg.destination}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'tracking' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Tracking Events ({trackingEvents.length})
              </h2>
              <Button
                variant="secondary"
                onClick={fetchTrackingEvents}
                disabled={trackingLoading}
              >
                {trackingLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            {trackingLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-4">
                {trackingEvents.length > 0 ? (
                  trackingEvents.map((event, index) => (
                    <div key={event._id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {event.statusName}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Location: {event.location}
                        </p>
                        {event.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No tracking events found for this package
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
            Package History
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Package Created</p>
                <p className="text-sm text-gray-500">
                  {new Date(pkg.entryDateTime).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Current Status</p>
                <p className="text-sm text-gray-500">
                  {getStatusName(pkg.status)} - {new Date().toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Last Updated</p>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
