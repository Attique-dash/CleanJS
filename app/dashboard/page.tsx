// ========================================
// app/dashboard/page.tsx
// ========================================
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Users, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

interface DashboardData {
  overview: {
    totalPackages: number;
    todayPackages: number;
    totalWeight: number;
    avgWeight: number;
    totalPieces: number;
    totalCustomers: number;
    activeCustomers: number;
    totalManifests: number;
  };
  statusDistribution: Array<{
    status: number;
    name: string;
    count: number;
    weight: number;
  }>;
  recentPackages: Array<{
    trackingNumber: string;
    controlNumber: string;
    customerName: string;
    shipper: string;
    status: number;
    statusName: string;
    weight: number;
    branch: string;
    entryDateTime: string;
  }>;
  topShippers: Array<{
    name: string;
    packages: number;
    totalWeight: number;
  }>;
  branchPerformance: Array<{
    name: string;
    totalPackages: number;
    totalWeight: number;
    pendingPackages: number;
    deliveredPackages: number;
    deliveryRate: number;
  }>;
  dailyTrends: Array<{
    date: string;
    packages: number;
    dayName: string;
  }>;
  alerts: {
    discrepancies: number;
    unknownPackages: number;
    unclaimedDelivered: number;
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe, selectedBranch]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeframe,
        ...(selectedBranch !== 'all' && { branch: selectedBranch })
      });
      
      const response = await fetch(`/api/admin/dashboard?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_stats' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchDashboardData();
      } else {
        toast.error('Failed to refresh data');
      }
    } catch (error) {
      toast.error('Error refreshing data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
        <Button onClick={fetchDashboardData} className="mt-4">Retry</Button>
      </div>
    );
  }

  const statusColors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your package management system</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={refreshData} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.totalPackages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.overview.todayPackages} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.totalWeight.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">
              Avg: {dashboardData.overview.avgWeight} kg per package
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.activeCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.overview.totalCustomers} total customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manifests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.totalManifests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active manifests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(dashboardData.alerts.discrepancies > 0 || 
        dashboardData.alerts.unknownPackages > 0 || 
        dashboardData.alerts.unclaimedDelivered > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alerts & Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.alerts.discrepancies > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm">Discrepancies</span>
                  <span className="font-bold text-red-600">{dashboardData.alerts.discrepancies}</span>
                </div>
              )}
              {dashboardData.alerts.unknownPackages > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm">Unknown Packages</span>
                  <span className="font-bold text-orange-600">{dashboardData.alerts.unknownPackages}</span>
                </div>
              )}
              {dashboardData.alerts.unclaimedDelivered > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm">Unclaimed Delivered</span>
                  <span className="font-bold text-blue-600">{dashboardData.alerts.unclaimedDelivered}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Package Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dashboardData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Package Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayName" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="packages" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Shippers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Shippers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topShippers.map((shipper, index) => (
                <div key={shipper.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{shipper.name}</p>
                      <p className="text-sm text-gray-500">{shipper.totalWeight} kg total</p>
                    </div>
                  </div>
                  <span className="font-bold">{shipper.packages} packages</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Branch Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.branchPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalPackages" fill="#3b82f6" name="Total Packages" />
                <Bar dataKey="deliveredPackages" fill="#10b981" name="Delivered" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Packages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipper
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recentPackages.map((pkg) => (
                  <tr key={pkg.trackingNumber} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pkg.trackingNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.shipper}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pkg.status === 4 
                          ? 'bg-green-100 text-green-800'
                          : pkg.status === 0
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pkg.statusName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.weight} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pkg.entryDateTime).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}