'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { ArrowLeft, Package, User, MapPin, Calendar, Weight, Truck, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Same interface as tracking page
interface PackageTracking {
  success: boolean;
  package: {
    trackingNumber: string;
    controlNumber: string;
    packageID: string;
    customer: {
      name: string;
      userCode: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    };
    details: {
      weight: number;
      dimensions: {
        cubes: number;
        length: number;
        width: number;
        height: number;
      };
      pieces: number;
      description: string;
      shipper: string;
      branch: string;
      hsCode: string | null;
    };
    currentStatus: {
      status: number;
      statusName: string;
      claimed: boolean;
      unknown: boolean;
      discrepancy: boolean;
      discrepancyDescription: string | null;
    };
    service: {
      serviceTypeID: string;
      serviceTypeName: string;
      hazmatCodeID: string | null;
      coloaded: boolean;
      coloadIndicator: string | null;
    };
    dates: {
      entryDate: string;
      entryDateTime: string;
      createdAt: string;
      updatedAt: string;
    };
    statusHistory: Array<{
      status: number;
      statusName: string;
      timestamp: string;
      location: string | null;
      notes: string | null;
      updatedBy: string;
    }>;
    manifest: {
      manifestID: string;
      manifestCode: string;
      flightDate: string;
      awbNumber: string;
      manifestStatus: string;
      serviceTypeID: string;
    } | null;
    additional: {
      aiProcessed: boolean;
      originalHouseNumber: string | null;
      packagePayments: string | null;
      entryStaff: string | null;
    };
  };
  summary: {
    isDelivered: boolean;
    isInTransit: boolean;
    isAtWarehouse: boolean;
    hasDiscrepancy: boolean;
    isClaimed: boolean;
    isUnknown: boolean;
    totalStatusUpdates: number;
    daysInSystem: number;
  };
}

export default function TrackingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trackingNumber = params.trackingNumber as string;
  
  const [trackingData, setTrackingData] = useState<PackageTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackingNumber) {
      fetchTrackingData();
    }
  }, [trackingNumber]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/packages/tracking/${encodeURIComponent(trackingNumber)}`);
      const data = await response.json();
      
      if (data.success) {
        setTrackingData(data);
      } else {
        setError(data.message || 'Package not found');
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Error fetching tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTrackingData();
    toast.success('Tracking information refreshed');
  };

  const getStatusColor = (status: number, isDelivered: boolean, isClaimed: boolean) => {
    if (isDelivered && isClaimed) return 'bg-green-100 text-green-800';
    if (isDelivered) return 'bg-blue-100 text-blue-800';
    if (status === 0) return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getProgressPercentage = (status: number) => {
    return Math.min((status + 1) * 20, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Package Not Found</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <div className="space-x-4">
          <Button onClick={() => router.back()}>Go Back</Button>
          <Button variant="outline" onClick={fetchTrackingData}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tracking data available</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Package {trackingData.package.trackingNumber}
            </h1>
            <p className="text-gray-500">
              Control Number: {trackingData.package.controlNumber}
            </p>
          </div>
        </div>
        
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Delivery Progress</span>
              <span className="text-sm text-gray-500">
                {getProgressPercentage(trackingData.package.currentStatus.status)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage(trackingData.package.currentStatus.status)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Received</span>
            <span>Airport</span>
            <span>In Transit</span>
            <span>Local Port</span>
            <span>Delivered</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card className={`${
        trackingData.summary.hasDiscrepancy ? 'border-yellow-200' : 
        trackingData.summary.isDelivered && trackingData.summary.isClaimed ? 'border-green-200' : 
        'border-gray-200'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Badge className={getStatusColor(
                trackingData.package.currentStatus.status,
                trackingData.summary.isDelivered,
                trackingData.summary.isClaimed
              )} size="lg">
                {trackingData.package.currentStatus.statusName}
              </Badge>
              {trackingData.summary.isClaimed && (
                <Badge variant="outline" className="ml-2">Claimed</Badge>
              )}
              {trackingData.summary.hasDiscrepancy && (
                <Badge variant="destructive" className="ml-2">Discrepancy</Badge>
              )}
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Last updated: {new Date(trackingData.package.dates.updatedAt).toLocaleString()}</p>
              <p>{trackingData.summary.daysInSystem} days in system</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Weight</span>
                <p className="font-medium">{trackingData.package.details.weight} kg</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Pieces</span>
                <p className="font-medium">{trackingData.package.details.pieces}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Shipper</span>
                <p className="font-medium">{trackingData.package.details.shipper}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Branch</span>
                <p className="font-medium">{trackingData.package.details.branch}</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Description</span>
              <p className="font-medium mt-1">{trackingData.package.details.description}</p>
            </div>
            
            {trackingData.package.details.hsCode && (
              <div>
                <span className="text-sm text-gray-500">HS Code</span>
                <p className="font-medium">{trackingData.package.details.hsCode}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm text-gray-500">Service Type</span>
              <p className="font-medium">{trackingData.package.service.serviceTypeName || 'Standard'}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Entry Date</span>
              <p className="font-medium">
                {new Date(trackingData.package.dates.entryDateTime).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Customer Name</span>
              <p className="font-medium">{trackingData.package.customer.name}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">User Code</span>
              <p className="font-medium">{trackingData.package.customer.userCode}</p>
            </div>
            
            {trackingData.package.customer.email && (
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{trackingData.package.customer.email}</p>
              </div>
            )}
            
            {trackingData.package.customer.phone && (
              <div>
                <span className="text-sm text-gray-500">Phone</span>
                <p className="font-medium">{trackingData.package.customer.phone}</p>
              </div>
            )}
            
            {trackingData.summary.isUnknown && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm text-yellow-700">Unknown customer - requires manual assignment</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manifest Information */}
      {trackingData.package.manifest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Manifest Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">Manifest Code</span>
                <p className="font-medium">{trackingData.package.manifest.manifestCode}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">AWB Number</span>
                <p className="font-medium">{trackingData.package.manifest.awbNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Flight Date</span>
                <p className="font-medium">
                  {new Date(trackingData.package.manifest.flightDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Manifest Status</span>
                <p className="font-medium">{trackingData.package.manifest.manifestStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancy Alert */}
      {trackingData.summary.hasDiscrepancy && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-red-800">Package Discrepancy Reported</h3>
                <p className="text-sm text-red-700 mt-1">
                  {trackingData.package.currentStatus.discrepancyDescription || 'No description provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {trackingData.package.statusHistory.map((status, index) => (
                <div key={index} className="relative flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index === 0 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-white border-gray-300'
                  }`}>
                    {index === 0 ? (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {status.statusName}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(status.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    {status.location && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {status.location}
                      </p>
                    )}
                    
                    {status.notes && (
                      <p className="text-sm text-gray-600 mt-1">{status.notes}</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Updated by: {status.updatedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Dimensions */}
      {(trackingData.package.details.dimensions.length > 0 || 
        trackingData.package.details.dimensions.width > 0 || 
        trackingData.package.details.dimensions.height > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Package Dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {trackingData.package.details.dimensions.length}
                </div>
                <div className="text-sm text-gray-500">Length (cm)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {trackingData.package.details.dimensions.width}
                </div>
                <div className="text-sm text-gray-500">Width (cm)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {trackingData.package.details.dimensions.height}
                </div>
                <div className="text-sm text-gray-500">Height (cm)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {trackingData.package.details.dimensions.cubes}
                </div>
                <div className="text-sm text-gray-500">Volume (cm³)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}