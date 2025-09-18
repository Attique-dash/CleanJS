// components/admin/Dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card'
import LoadingSpinner from '../ui/LoadingSpinner'
import Badge from '../ui/badge'

interface DashboardData {
  overview: {
    totalPackages: number
    todayPackages: number
    totalWeight: number
    avgWeight: number
    totalCustomers: number
    activeCustomers: number
    totalManifests: number
  }
  statusDistribution: Array<{
    status: number
    name: string
    count: number
    weight: number
  }>
  recentPackages: Array<{
    trackingNumber: string
    controlNumber: string
    customerName: string
    shipper: string
    status: number
    statusName: string
    weight: number
    branch: string
    entryDateTime: string
  }>
  topShippers: Array<{
    name: string
    packages: number
    totalWeight: number
  }>
  branchPerformance: Array<{
    name: string
    totalPackages: number
    totalWeight: number
    pendingPackages: number
    deliveredPackages: number
    deliveryRate: number
  }>
  dailyTrends: Array<{
    date: string
    packages: number
    dayName: string
  }>
  alerts: {
    discrepancies: number
    unknownPackages: number
    unclaimedDelivered: number
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30')
  const [selectedBranch, setSelectedBranch] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [timeframe, selectedBranch])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('timeframe', timeframe)
      if (selectedBranch) params.append('branch', selectedBranch)

      const response = await fetch(`/api/admin/dashboard?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: number) => {
    const colors = {
      0: 'bg-yellow-100 text-yellow-800',
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-indigo-100 text-indigo-800',
      3: 'bg-purple-100 text-purple-800',
      4: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!data) {
    return <div>Failed to load dashboard data</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        
        <select 
          value={selectedBranch} 
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Branches</option>
          <option value="Main">Main Branch</option>
          <option value="Down Town">Downtown</option>
          <option value="Airport">Airport</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Packages</p>
              <p className="text-2xl font-semibold text-gray-900">{data.overview.totalPackages.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            +{data.overview.todayPackages} today
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="text-2xl font-semibold text-gray-900">{data.overview.totalWeight.toLocaleString()} kg</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Avg: {data.overview.avgWeight} kg
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{data.overview.activeCustomers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            of {data.overview.totalCustomers} total
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Manifests</p>
              <p className="text-2xl font-semibold text-gray-900">{data.overview.totalManifests.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Status Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {data.statusDistribution.map((status) => (
            <div key={status.status} className="text-center">
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                {status.name}
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{status.count}</p>
              <p className="text-sm text-gray-500">{status.weight} kg</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Packages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Packages</h3>
          <div className="space-y-4">
            {data.recentPackages.slice(0, 5).map((pkg) => (
              <div key={pkg.trackingNumber} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{pkg.trackingNumber}</p>
                  <p className="text-sm text-gray-600">{pkg.customerName} • {pkg.shipper}</p>
                  <p className="text-xs text-gray-500">{pkg.branch}</p>
                </div>
                <div className="text-right">
                  <Badge variant={pkg.status === 4 ? 'success' : pkg.status === 0 ? 'warning' : 'info'}>
                    {pkg.statusName}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">{pkg.weight} kg</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Shippers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Shippers</h3>
          <div className="space-y-4">
            {data.topShippers.slice(0, 5).map((shipper, index) => (
              <div key={shipper.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{shipper.name}</p>
                    <p className="text-sm text-gray-600">{shipper.totalWeight} kg total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{shipper.packages}</p>
                  <p className="text-sm text-gray-600">packages</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Branch Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Packages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.branchPerformance.map((branch) => (
                <tr key={branch.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.totalPackages}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.totalWeight} kg</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.pendingPackages}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.deliveredPackages}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${branch.deliveryRate}%` }}
                        ></div>
                      </div>
                      <span>{branch.deliveryRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alerts */}
      {(data.alerts.discrepancies > 0 || data.alerts.unknownPackages > 0 || data.alerts.unclaimedDelivered > 0) && (
        <Card className="p-6 border-l-4 border-red-500 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Alerts & Issues</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.alerts.discrepancies > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{data.alerts.discrepancies}</p>
                <p className="text-sm text-red-800">Discrepancies</p>
              </div>
            )}
            {data.alerts.unknownPackages > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{data.alerts.unknownPackages}</p>
                <p className="text-sm text-yellow-800">Unknown Packages</p>
              </div>
            )}
            {data.alerts.unclaimedDelivered > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{data.alerts.unclaimedDelivered}</p>
                <p className="text-sm text-orange-800">Unclaimed Delivered</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}