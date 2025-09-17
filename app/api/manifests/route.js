// ========================================
// app/api/manifests/route.js
// ========================================
import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/config/database';
import Manifest from '../../../lib/models/Manifest';
import Package from '../../../lib/models/Package';

// GET /api/manifests - Get all manifests
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courierID = searchParams.get('courierID');
    const serviceTypeID = searchParams.get('serviceTypeID');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;
    
    console.log('📋 Fetching manifests with filters:', { 
      courierID, serviceTypeID, status, search, startDate, endDate, limit, skip 
    });
    
    // Build query
    let query = {};
    
    if (courierID) query.courierID = courierID;
    if (serviceTypeID) query.serviceTypeID = serviceTypeID;
    if (status !== null && status !== undefined && status !== '') {
      query.manifestStatus = status;
    }
    
    if (search) {
      query.$or = [
        { manifestCode: { $regex: search, $options: 'i' } },
        { awbNumber: { $regex: search, $options: 'i' } },
        { staffName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      query.entryDateTime = {};
      if (startDate) query.entryDateTime.$gte = new Date(startDate);
      if (endDate) query.entryDateTime.$lte = new Date(endDate);
    }
    
    // Get total count
    const totalCount = await Manifest.countDocuments(query);
    
    // Fetch manifests with packages
    const manifests = await Manifest.find(query)
      .populate('packages', 'trackingNumber controlNumber packageStatus weight')
      .sort({ entryDateTime: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    // Format manifests for response
    const formattedManifests = manifests.map(manifest => ({
      ...manifest,
      statusName: getManifestStatusName(manifest.manifestStatus),
      serviceTypeName: getServiceTypeName(manifest.serviceTypeID),
      packageCount: manifest.packages?.length || 0,
      totalPackageWeight: manifest.packages?.reduce((sum, pkg) => sum + (pkg.weight || 0), 0) || 0,
      pendingPackages: manifest.packages?.filter(pkg => pkg.packageStatus < 4).length || 0,
      deliveredPackages: manifest.packages?.filter(pkg => pkg.packageStatus === 4).length || 0
    }));
    
    console.log(`✅ Found ${formattedManifests.length} manifests (${totalCount} total)`);
    
    return NextResponse.json({
      success: true,
      data: formattedManifests,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + formattedManifests.length < totalCount,
        currentPage: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: { courierID, serviceTypeID, status, search, startDate, endDate }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Manifests fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch manifests',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/manifests - Create new manifest
export async function POST(request) {
  try {
    await connectDB();
    
    const manifestData = await request.json();
    console.log('📋 Creating new manifest:', manifestData);
    
    // Validate required fields
    const requiredFields = ['manifestCode', 'courierID', 'serviceTypeID', 'flightDate', 'weight', 'itemCount', 'staffName', 'awbNumber'];
    const missingFields = requiredFields.filter(field => !manifestData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check if manifest already exists
    const existingManifest = await Manifest.findOne({
      $or: [
        { manifestCode: manifestData.manifestCode },
        { awbNumber: manifestData.awbNumber }
      ]
    });
    
    if (existingManifest) {
      return NextResponse.json(
        { success: false, message: 'Manifest with this code or AWB number already exists' },
        { status: 400 }
      );
    }
    
    // Create new manifest
    const newManifest = new Manifest({
      manifestCode: manifestData.manifestCode,
      courierID: manifestData.courierID,
      serviceTypeID: manifestData.serviceTypeID,
      manifestStatus: manifestData.manifestStatus || "0",
      flightDate: new Date(manifestData.flightDate),
      weight: manifestData.weight,
      itemCount: manifestData.itemCount,
      manifestNumber: manifestData.manifestNumber || Math.floor(Math.random() * 10000),
      staffName: manifestData.staffName,
      entryDate: manifestData.entryDate ? new Date(manifestData.entryDate) : new Date(),
      entryDateTime: manifestData.entryDateTime ? new Date(manifestData.entryDateTime) : new Date(),
      awbNumber: manifestData.awbNumber,
      packages: manifestData.packages || []
    });
    
    await newManifest.save();
    
    // Update associated packages if provided
    if (manifestData.packages && Array.isArray(manifestData.packages)) {
      await Package.updateMany(
        { _id: { $in: manifestData.packages } },
        { manifestID: newManifest.manifestID }
      );
    }
    
    console.log(`✅ Manifest created: ${newManifest.manifestCode}`);
    
    return NextResponse.json({
      success: true,
      message: 'Manifest created successfully',
      data: newManifest
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Manifest creation error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Manifest with this code already exists' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)[0].message;
      return NextResponse.json(
        { success: false, message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create manifest',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

function getManifestStatusName(status) {
  const statusNames = {
    "0": 'AT WAREHOUSE',
    "1": 'DELIVERED TO AIRPORT',
    "2": 'IN TRANSIT TO LOCAL PORT',
    "3": 'AT LOCAL PORT',
    "4": 'AT LOCAL SORTING'
  };
  return statusNames[status] || 'UNKNOWN';
}

function getServiceTypeName(serviceTypeID) {
  const serviceTypes = {
    '59cadcd4-7508-450b-85aa-9ec908d168fe': 'AIR STANDARD',
    '25a1d8e5-a478-4cc3-b1fd-a37d0d787302': 'AIR EXPRESS',
    '8df142ca-0573-4ce9-b11d-7a3e5f8ba196': 'AIR PREMIUM',
    '7c9638e8-4bb3-499e-8af9-d09f757a099e': 'SEA STANDARD',
    '': 'UNSPECIFIED'
  };
  return serviceTypes[serviceTypeID] || 'UNKNOWN';
}