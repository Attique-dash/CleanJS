import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/config/database';
import Package from '../../../lib/models/Package';
import Customer from '../../../lib/models/Customer';
import Manifest from '../../../lib/models/Manifest';

// GET /api/packages - Get all packages with filtering and pagination
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');
    const shipper = searchParams.get('shipper');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;
    const sortBy = searchParams.get('sortBy') || 'entryDateTime';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    console.log('📦 Fetching packages with filters:', { 
      status, branch, shipper, search, startDate, endDate, limit, skip 
    });
    
    // Build query
    let query = {};
    
    if (status !== null && status !== undefined && status !== '') {
      query.packageStatus = parseInt(status);
    }
    
    if (branch) {
      query.branch = branch;
    }
    
    if (shipper) {
      query.shipper = { $regex: shipper, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { controlNumber: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { userCode: { $regex: search, $options: 'i' } },
        { shipper: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      query.entryDateTime = {};
      if (startDate) {
        query.entryDateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.entryDateTime.$lte = new Date(endDate);
      }
    }
    
    // Get total count for pagination
    const totalCount = await Package.countDocuments(query);
    
    // Fetch packages
    const packages = await Package.find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip(skip)
      .populate('customerRef', 'userCode firstName lastName email phone')
      .lean();
    
    // Format packages for response
    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      customerName: pkg.customerRef ? 
        `${pkg.customerRef.firstName} ${pkg.customerRef.lastName}` : 
        `${pkg.firstName} ${pkg.lastName}`,
      customerEmail: pkg.customerRef?.email || null,
      customerPhone: pkg.customerRef?.phone || null,
      statusName: getStatusName(pkg.packageStatus),
      serviceTypeName: getServiceTypeName(pkg.serviceTypeID),
      hazmatName: pkg.hazmatCodeID ? getHazmatName(pkg.hazmatCodeID) : null,
      daysInSystem: Math.floor((new Date() - new Date(pkg.entryDateTime)) / (1000 * 60 * 60 * 24))
    }));
    
    console.log(`✅ Found ${formattedPackages.length} packages (${totalCount} total)`);
    
    return NextResponse.json({
      success: true,
      data: formattedPackages,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + formattedPackages.length < totalCount,
        currentPage: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        status, branch, shipper, search, startDate, endDate
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Packages fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch packages',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/packages - Create new package
export async function POST(request) {
  try {
    await connectDB();
    
    const packageData = await request.json();
    console.log('📦 Creating new package:', packageData);
    
    // Validate required fields
    const requiredFields = ['trackingNumber', 'controlNumber', 'firstName', 'lastName', 'userCode', 'weight', 'shipper', 'description', 'branch'];
    const missingFields = requiredFields.filter(field => !packageData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check if package already exists
    const existingPackage = await Package.findOne({
      $or: [
        { trackingNumber: packageData.trackingNumber },
        { controlNumber: packageData.controlNumber }
      ]
    });
    
    if (existingPackage) {
      return NextResponse.json(
        { success: false, message: 'Package with this tracking number or control number already exists' },
        { status: 400 }
      );
    }
    
    // Find customer
    const customer = await Customer.findOne({ userCode: packageData.userCode });
    if (!customer) {
      return NextResponse.json(
        { success: false, message: `Customer not found for user code: ${packageData.userCode}` },
        { status: 400 }
      );
    }
    
    // Create new package
    const newPackage = new Package({
      trackingNumber: packageData.trackingNumber,
      controlNumber: packageData.controlNumber,
      firstName: packageData.firstName.trim(),
      lastName: packageData.lastName.trim(),
      userCode: packageData.userCode.trim().toUpperCase(),
      weight: packageData.weight,
      shipper: packageData.shipper.trim(),
      description: packageData.description.trim(),
      branch: packageData.branch.trim(),
      customerRef: customer._id,
      courierID: packageData.courierID || '',
      manifestID: packageData.manifestID || '',
      collectionID: packageData.collectionID || '',
      entryStaff: packageData.entryStaff || 'Admin',
      entryDate: packageData.entryDate ? new Date(packageData.entryDate) : new Date(),
      entryDateTime: packageData.entryDateTime ? new Date(packageData.entryDateTime) : new Date(),
      claimed: packageData.claimed || false,
      apiToken: packageData.apiToken || process.env.TASOKO_API_TOKEN || 'default-token',
      showControls: packageData.showControls || false,
      hsCode: packageData.hsCode || '',
      unknown: false,
      aiProcessed: packageData.aiProcessed || false,
      originalHouseNumber: packageData.originalHouseNumber || '',
      dimensions: {
        cubes: packageData.dimensions?.cubes || packageData.cubes || 0,
        length: packageData.dimensions?.length || packageData.length || 0,
        width: packageData.dimensions?.width || packageData.width || 0,
        height: packageData.dimensions?.height || packageData.height || 0
      },
      pieces: packageData.pieces || 1,
      discrepancy: packageData.discrepancy || false,
      discrepancyDescription: packageData.discrepancyDescription || '',
      serviceTypeID: packageData.serviceTypeID || '',
      hazmatCodeID: packageData.hazmatCodeID || '',
      coloaded: packageData.coloaded || false,
      coloadIndicator: packageData.coloadIndicator || '',
      packageStatus: packageData.packageStatus || 0,
      packagePayments: packageData.packagePayments || ''
    });
    
    await newPackage.save();
    
    // Update customer package statistics
    await customer.updatePackageStats();
    await customer.save();
    
    console.log(`✅ Package created: ${newPackage.trackingNumber}`);
    
    return NextResponse.json({
      success: true,
      message: 'Package created successfully',
      data: newPackage
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Package creation error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Package with this tracking number already exists' },
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
        message: 'Failed to create package',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/packages - Bulk update packages
export async function PUT(request) {
  try {
    await connectDB();
    
    const { action, packageIds, updateData } = await request.json();
    
    if (!action || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Action and package IDs are required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Bulk ${action} operation for ${packageIds.length} packages`);
    
    let result;
    
    switch (action) {
      case 'update_status':
        if (updateData.status === undefined) {
          return NextResponse.json(
            { success: false, message: 'Status is required for status update' },
            { status: 400 }
          );
        }
        
        // Update each package individually to trigger status history
        const packages = await Package.find({ _id: { $in: packageIds } });
        let updatedCount = 0;
        
        for (const pkg of packages) {
          pkg.updateStatus(
            updateData.status,
            updateData.location || pkg.branch,
            updateData.notes || 'Bulk status update',
            updateData.updatedBy || 'Admin'
          );
          await pkg.save();
          updatedCount++;
        }
        
        result = { modifiedCount: updatedCount };
        break;
        
      case 'update_branch':
        if (!updateData.branch) {
          return NextResponse.json(
            { success: false, message: 'Branch is required for branch update' },
            { status: 400 }
          );
        }
        result = await Package.updateMany(
          { _id: { $in: packageIds } },
          { branch: updateData.branch, updatedAt: new Date() }
        );
        break;
        
      case 'mark_claimed':
        result = await Package.updateMany(
          { _id: { $in: packageIds } },
          { claimed: true, updatedAt: new Date() }
        );
        break;
        
      case 'mark_unclaimed':
        result = await Package.updateMany(
          { _id: { $in: packageIds } },
          { claimed: false, updatedAt: new Date() }
        );
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
    
    console.log(`✅ Bulk operation completed: ${result.modifiedCount} packages updated`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.modifiedCount} packages`,
      modifiedCount: result.modifiedCount
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Bulk package operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to perform bulk operation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getStatusName(status) {
  const statusNames = {
    0: 'AT WAREHOUSE',
    1: 'DELIVERED TO AIRPORT',
    2: 'IN TRANSIT TO LOCAL PORT',
    3: 'AT LOCAL PORT',
    4: 'AT LOCAL SORTING'
  };
  return statusNames[status] || 'UNKNOWN STATUS';
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

function getHazmatName(hazmatCodeID) {
  const hazmatCodes = {
    '0acc224d-2eeb-44c1-b472-8c671893b4e9': 'Oxidizer',
    '1cad6a51-29f9-4065-ad07-dc22b44aefb6': 'Explosive 1.6 N',
    '2291c23f-48f6-413b-81a9-f819cc0c9ec9': 'Flammable Liquid',
    '345eb0e3-d6f7-4e0c-bf89-79b16e0fe35f': 'Infectious substance',
    '3f06f49f-f707-430d-bf84-f3f5a72cdb2f': 'Organic Peroxide',
    '4ec484e9-4398-40eb-a98c-b0fbf85847dc': 'Toxic Gas, Inhalation Hazard'
    // Add more as needed from the PDF
  };
  return hazmatCodes[hazmatCodeID] || 'Unknown Hazmat';
}