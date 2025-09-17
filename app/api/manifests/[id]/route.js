import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Manifest from '../../../../lib/models/Manifest';
import Package from '../../../../lib/models/Package';

// GET /api/manifests/[id] - Get manifest details
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Manifest ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`📋 Fetching manifest details: ${id}`);
    
    // Find manifest by ID, manifestID, or manifestCode
    const manifest = await Manifest.findOne({
      $or: [
        { _id: id },
        { manifestID: id },
        { manifestCode: id }
      ]
    }).populate('packages', 'trackingNumber controlNumber packageStatus weight firstName lastName userCode');
    
    if (!manifest) {
      return NextResponse.json(
        { success: false, message: 'Manifest not found' },
        { status: 404 }
      );
    }
    
    // Format manifest details
    const manifestDetails = {
      ...manifest.toTasokoFormat(),
      statusName: getManifestStatusName(manifest.manifestStatus),
      serviceTypeName: getServiceTypeName(manifest.serviceTypeID),
      packages: manifest.packages?.map(pkg => ({
        _id: pkg._id,
        trackingNumber: pkg.trackingNumber,
        controlNumber: pkg.controlNumber,
        customerName: `${pkg.firstName} ${pkg.lastName}`,
        userCode: pkg.userCode,
        weight: pkg.weight,
        status: pkg.packageStatus,
        statusName: getPackageStatusName(pkg.packageStatus)
      })) || [],
      packageCount: manifest.packages?.length || 0,
      totalWeight: manifest.packages?.reduce((sum, pkg) => sum + (pkg.weight || 0), 0) || 0,
      pendingPackages: manifest.packages?.filter(pkg => pkg.packageStatus < 4).length || 0,
      deliveredPackages: manifest.packages?.filter(pkg => pkg.packageStatus === 4).length || 0
    };
    
    console.log(`✅ Manifest details retrieved: ${manifest.manifestCode}`);
    
    return NextResponse.json({
      success: true,
      data: manifestDetails
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Manifest details fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch manifest details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/manifests/[id] - Update manifest
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const updateData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Manifest ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Updating manifest: ${id}`, updateData);
    
    // Find manifest
    const manifest = await Manifest.findOne({
      $or: [
        { _id: id },
        { manifestID: id },
        { manifestCode: id }
      ]
    });
    
    if (!manifest) {
      return NextResponse.json(
        { success: false, message: 'Manifest not found' },
        { status: 404 }
      );
    }
    
    // Store old status for comparison
    const oldStatus = manifest.manifestStatus;
    
    // Update manifest fields
    if (updateData.manifestCode) manifest.manifestCode = updateData.manifestCode;
    if (updateData.courierID) manifest.courierID = updateData.courierID;
    if (updateData.serviceTypeID !== undefined) manifest.serviceTypeID = updateData.serviceTypeID;
    if (updateData.flightDate) manifest.flightDate = new Date(updateData.flightDate);
    if (updateData.weight !== undefined) manifest.weight = updateData.weight;
    if (updateData.itemCount !== undefined) manifest.itemCount = updateData.itemCount;
    if (updateData.manifestNumber !== undefined) manifest.manifestNumber = updateData.manifestNumber;
    if (updateData.staffName) manifest.staffName = updateData.staffName;
    if (updateData.awbNumber) manifest.awbNumber = updateData.awbNumber;
    
    // Handle status update with history
    if (updateData.manifestStatus !== undefined && updateData.manifestStatus !== oldStatus) {
      manifest.updateStatus(
        updateData.manifestStatus,
        updateData.location || 'Warehouse',
        updateData.statusNotes || `Status updated to ${getManifestStatusName(updateData.manifestStatus)}`,
        updateData.updatedBy || 'Admin'
      );
    }
    
    // Handle package association updates
    if (updateData.packages && Array.isArray(updateData.packages)) {
      // Remove old associations
      await Package.updateMany(
        { manifestID: manifest.manifestID },
        { manifestID: '' }
      );
      
      // Add new associations
      await Package.updateMany(
        { _id: { $in: updateData.packages } },
        { manifestID: manifest.manifestID }
      );
      
      manifest.packages = updateData.packages;
    }
    
    manifest.updatedAt = new Date();
    await manifest.save();
    
    console.log(`✅ Manifest updated: ${manifest.manifestCode}`);
    
    return NextResponse.json({
      success: true,
      message: 'Manifest updated successfully',
      data: manifest.toTasokoFormat()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Manifest update error:', error);
    
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
        message: 'Failed to update manifest',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/manifests/[id] - Delete manifest
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Manifest ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Deleting manifest: ${id}`);
    
    // Find manifest
    const manifest = await Manifest.findOne({
      $or: [
        { _id: id },
        { manifestID: id },
        { manifestCode: id }
      ]
    });
    
    if (!manifest) {
      return NextResponse.json(
        { success: false, message: 'Manifest not found' },
        { status: 404 }
      );
    }
    
    // Check if manifest has associated packages
    const associatedPackages = await Package.countDocuments({ manifestID: manifest.manifestID });
    
    if (associatedPackages > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete manifest with associated packages. Manifest has ${associatedPackages} packages.`
        },
        { status: 400 }
      );
    }
    
    // Store manifest data for response
    const manifestData = {
      manifestCode: manifest.manifestCode,
      manifestID: manifest.manifestID,
      awbNumber: manifest.awbNumber
    };
    
    // Delete manifest
    await Manifest.findByIdAndDelete(manifest._id);
    
    console.log(`✅ Manifest deleted: ${manifestData.manifestCode}`);
    
    return NextResponse.json({
      success: true,
      message: 'Manifest deleted successfully',
      deletedManifest: manifestData
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Manifest deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete manifest',
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

function getPackageStatusName(status) {
  const statusNames = {
    0: 'AT WAREHOUSE',
    1: 'DELIVERED TO AIRPORT',
    2: 'IN TRANSIT TO LOCAL PORT',
    3: 'AT LOCAL PORT', 
    4: 'AT LOCAL SORTING'
  };
  return statusNames[status] || 'UNKNOWN';
}