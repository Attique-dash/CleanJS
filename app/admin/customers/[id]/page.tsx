// app/admin/customers/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Card } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'
import Badge from '../../../../components/ui/badge'

interface Customer {
  _id: string
  userCode: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  branch: string
  isActive: boolean
  packageStats: {
    totalPackages: number
    pendingPackages: number
    deliveredPackages: number
    totalWeight: number
  }
  customerServiceTypeID: string
  customerLevelInstructions: string
  courierServiceTypeID: string
  courierLevelInstructions: string
  lastActivity: string
  createdAt: string
  updatedAt: string
}

interface Package {
  _id: string
  trackingNumber: string
  controlNumber: string
  shipper: string
  weight: number
  packageStatus: number
  statusName: string
  entryDateTime: string
  description: string
  branch: string
}

export default function CustomerDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
      fetchCustomerPackages()
    }
  }, [customerId])

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${customerId}`)
      const result = await response.json()
      
      if (result.success) {
        setCustomer(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch customer details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerPackages = async () => {
    try {
      setPackagesLoading(true)
      const response = await fetch(`/api/customers/${customerId}/packages`)
      const result = await response.json()
      
      if (result.success) {
        setPackages(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch customer packages:', error)
    } finally {
      setPackagesLoading(false)
    }
  }

  const getServiceTypeName = (serviceTypeID: string) => {
    const serviceTypes: Record<string, string> = {
      '59cadcd4-7508-450b-85aa-9ec908d168fe': 'AIR STANDARD',
      '25a1d8e5-a478-4cc3-b1fd-a37d0d787302': 'AIR EXPRESS',
      '8df142ca-0573-4ce9-b11d-7a3e5f8ba196': 'AIR PREMIUM',
      '7c9638e8-4bb3-499e-8af9-d09f757a099e': 'SEA STANDARD',
      '': 'UNSPECIFIED'
    }
    return serviceTypes[serviceTypeID] || 'UNKNOWN'
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

  if (!customer) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Customer not found</div>
        <Button onClick={() => router.push('/admin/customers')}>
          Back to Customers
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
              onClick={() => router.push('/admin/customers')}
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <Badge variant={customer.isActive ? 'success' : 'warning'}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">Customer ID: {customer.userCode}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/admin/customers/${customerId}/edit`)}
          >
            Edit Customer
          </Button>
          <Button onClick={() => window.print()}>
            Print Details
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
          {/* Customer Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{customer.firstName} {customer.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">User Code</label>
                <p className="font-mono text-gray-900">{customer.userCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{customer.email}</p>
              </div>
              {customer.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
              )}
              {customer.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{customer.address}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Branch</label>
                <p className="text-gray-900">{customer.branch}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Customer Service Type</label>
                <Badge variant="info">
                  {getServiceTypeName(customer.customerServiceTypeID)}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Courier Service Type</label>
                <Badge variant="info">
                  {getServiceTypeName(customer.courierServiceTypeID)}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Package Statistics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Package Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {customer.packageStats.totalPackages}
                </p>
                <p className="text-sm text-blue-600">Total Packages</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {customer.packageStats.pendingPackages}
                </p>
                <p className="text-sm text-orange-600">Pending</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {customer.packageStats.deliveredPackages}
                </p>
                <p className="text-sm text-green-600">Delivered</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {customer.packageStats.totalWeight.toFixed(1)} kg
                </p>
                <p className="text-sm text-purple-600">Total Weight</p>
              </div>
            </div>
          </Card>

          {/* Instructions */}
          {(customer.customerLevelInstructions || customer.courierLevelInstructions) && (
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Special Instructions
              </h2>
              <div className="space-y-4">
                {customer.customerLevelInstructions && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Instructions</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                      {customer.customerLevelInstructions}
                    </p>
                  </div>
                )}
                {customer.courierLevelInstructions && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Courier Instructions</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                      {customer.courierLevelInstructions}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'packages' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer Packages ({packages.length})
              </h2>
              <Button
                variant="secondary"
                onClick={fetchCustomerPackages}
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
                        Shipper
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pkg.shipper}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pkg.weight} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={pkg.packageStatus === 4 ? 'success' : 'warning'}>
                            {getStatusName(pkg.packageStatus)}
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
                    No packages found for this customer
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
            Account History
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Account Created</p>
                <p className="text-sm text-gray-500">
                  {new Date(customer.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Last Updated</p>
                <p className="text-sm text-gray-500">
                  {new Date(customer.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Last Activity</p>
                <p className="text-sm text-gray-500">
                  {new Date(customer.lastActivity).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}