'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/badge';
import { Search, Package, User, MapPin, Calendar, Weight, Truck, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function TrackingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingData, setTrackingData] = useState<PackageTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/packages/tracking/${encodeURIComponent(searchTerm.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        setTrackingData(data);
      } else {
        setError(data.message || 'Package not found');
        setTrackingData(null);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Error fetching tracking information');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number, isDelivered: boolean, isClaimed: boolean) => {
    if (isDelivered && isClaimed) return 'bg-green-100 text-green-800';
    if (isDelivered) return 'bg-blue-100 text-blue-800';
    if (status === 0) return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Package Tracking</h1>
        <p className="text-gray-500">Track packages by tracking number or control number</p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter tracking number or control number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={loading} className="px-8">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Track Package
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Results */}
      {trackingData && (
        <div className="space-y-6">
          {/* Package Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Package Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Tracking Number:</span>
                    <p className="font-medium">{trackingData.package.trackingNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Control Number:</span>
                    <p className="font-medium">{trackingData.package.controlNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <div className="mt-1">
                      <Badge className={getStatusColor(
                        trackingData.package.currentStatus.status,
                        trackingData.summary.isDelivered,
                        trackingData.summary.isClaimed
                      )}>
                        {trackingData.package.currentStatus.statusName}
                      </Badge>
                      {trackingData.summary.isClaimed && (
                        <Badge variant='outline' className="ml-2">Claimed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Name:</span>
                    <p className="font-medium">{trackingData.package.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">User Code:</span>
                    <p className="font-medium">{trackingData.package.customer.userCode}</p>
                  </div>
                  {trackingData.package.customer.email && (
                    <div>
                      <span className="text-sm text-gray-500">Email:</span>
                      <p className="font-medium">{trackingData.package.customer.email}</p>
                    </div>
                  )}
                  {trackingData.package.customer.phone && (
                    <div>
                      <span className="text-sm text-gray-500">Phone:</span>
                      <p className="font-medium">{trackingData.package.customer.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Weight className="h-5 w-5 mr-2" />
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Weight:</span>
                    <p className="font-medium">{trackingData.package.details.weight} kg</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Pieces:</span>
                    <p className="font-medium">{trackingData.package.details.pieces}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Shipper:</span>
                    <p className="font-medium">{trackingData.package.details.shipper}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Branch:</span>
                    <p className="font-medium">{trackingData.package.details.branch}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(trackingData.summary.hasDiscrepancy || trackingData.summary.isUnknown) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Package Alerts</h3>
                    <div className="mt-2 space-y-1">
                      {trackingData.summary.hasDiscrepancy && (
                        <p className="text-sm text-yellow-700">
                          ⚠️ Discrepancy reported: {trackingData.package.currentStatus.discrepancyDescription}
                        </p>
                      )}
                      {trackingData.summary.isUnknown && (
                        <p className="text-sm text-yellow-700">
                          ⚠️ Unknown customer - package requires manual assignment
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingData.package.statusHistory.map((status, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {status.status === 4 ? <Package className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{status.statusName}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(status.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {status.location && (
                        <p className="text-sm text-gray-600 mt-1">📍 {status.location}</p>
                      )}
                      {status.notes && (
                        <p className="text-sm text-gray-600 mt-1">{status.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Updated by: {status.updatedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Manifest Code:</span>
                    <p className="font-medium">{trackingData.package.manifest.manifestCode}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">AWB Number:</span>
                    <p className="font-medium">{trackingData.package.manifest.awbNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Flight Date:</span>
                    <p className="font-medium">
                      {new Date(trackingData.package.manifest.flightDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Manifest Status:</span>
                    <p className="font-medium">{trackingData.package.manifest.manifestStatus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Package Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Package Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {trackingData.summary.daysInSystem}
                  </div>
                  <div className="text-sm text-gray-500">Days in System</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {trackingData.summary.totalStatusUpdates}
                  </div>
                  <div className="text-sm text-gray-500">Status Updates</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {trackingData.package.details.weight}kg
                  </div>
                  <div className="text-sm text-gray-500">Total Weight</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {trackingData.package.service.serviceTypeName || 'Standard'}
                  </div>
                  <div className="text-sm text-gray-500">Service Type</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Description */}
          <Card>
            <CardHeader>
              <CardTitle>Package Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{trackingData.package.details.description}</p>
              
              {trackingData.package.details.dimensions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Dimensions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Length:</span>
                      <span className="ml-1 font-medium">{trackingData.package.details.dimensions.length} cm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Width:</span>
                      <span className="ml-1 font-medium">{trackingData.package.details.dimensions.width} cm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Height:</span>
                      <span className="ml-1 font-medium">{trackingData.package.details.dimensions.height} cm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Volume:</span>
                      <span className="ml-1 font-medium">{trackingData.package.details.dimensions.cubes} cm³</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
