import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Package from '../../../../lib/models/Package';
import Customer from '../../../../lib/models/Customer';
import Manifest from '../../../../lib/models/Manifest';

// GET /api/packages/[id] - Get package details
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Package ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`📦 Fetching package details: ${id}`);
    
    // Find package by ID, tracking number, or control number
    const pkg = await Package.findOne({
      $or: [
        { _id: id },
        { trackingNumber: id },
        { controlNumber: id },
        { packageID: id }
      ]
    }).populate('customerRef', 'userCode firstName lastName email phone address branch');
    
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }
    
    // Get manifest information if available
    let manifestInfo = null;
    if (pkg.manifestID) {
      manifestInfo = await Manifest.findOne({ manifestID: pkg.manifestID })
        .select('manifestCode flightDate awbNumber serviceTypeID manifestStatus staffName');
    }
    
    // Format package details
    const packageDetails = {
      // Basic Package Information
      _id: pkg._id,
      packageID: pkg.packageID,
      trackingNumber: pkg.trackingNumber,
      controlNumber: pkg.controlNumber,
      
      // Customer Information
      customer: {
        _id: pkg.customerRef?._id,
        userCode: pkg.userCode,
        firstName: pkg.firstName,
        lastName: pkg.lastName,
        fullName: `${pkg.firstName} ${pkg.lastName}`,
        email: pkg.customerRef?.email,
        phone: pkg.customerRef?.phone,
        address: pkg.customerRef?.address
      },
      
      // Package Details
      weight: pkg.weight,
      dimensions: pkg.dimensions,
      pieces: pkg.pieces,
      description: pkg.description,
      shipper: pkg.shipper,
      branch: pkg.branch,
      hsCode: pkg.hsCode,
      
      // Status Information
      packageStatus: pkg.packageStatus,
      statusName: pkg.statusName,
      claimed: pkg.claimed,
      unknown: pkg.unknown,
      discrepancy: pkg.discrepancy,
      discrepancyDescription: pkg.discrepancyDescription,
      
      // Service Information
      serviceTypeID: pkg.serviceTypeID,
      serviceTypeName: pkg.serviceTypeName,
      hazmatCodeID: pkg.hazmatCodeID,
      hazmatName: pkg.hazmatName,
      coloaded: pkg.coloaded,
      coloadIndicator: pkg.coloadIndicator,
      
      // Dates and Entry
      entryDate: pkg.entryDate,
      entryDateTime: pkg.entryDateTime,
      entryStaff: pkg.entryStaff,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
      
      // Status History
      statusHistory: pkg.statusHistory.map(history => ({
        status: history.status,
        statusName: getStatusName(history.status),
        timestamp: history.timestamp,
        location: history.location,
        notes: history.notes,
        updatedBy: history.updatedBy
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      
      // Manifest Information
      manifest: manifestInfo ? {
        manifestID: pkg.manifestID,
        manifestCode: manifestInfo.manifestCode,
        flightDate: manifestInfo.flightDate,
        awbNumber: manifestInfo.awbNumber,
        manifestStatus: manifestInfo.manifestStatus,
        serviceTypeID: manifestInfo.serviceTypeID,
        staffName: manifestInfo.staffName
      } : null,
      
      // Additional Fields
      courierID: pkg.courierID,
      collectionID: pkg.collectionID,
      apiToken: pkg.apiToken ? '***masked***' : null,
      showControls: pkg.showControls,
      aiProcessed: pkg.aiProcessed,
      originalHouseNumber: pkg.originalHouseNumber,
      packagePayments: pkg.packagePayments,
      
      // Calculated Fields
      daysInSystem: Math.floor((new Date() - pkg.entryDateTime) / (1000 * 60 * 60 * 24)),
      isDelivered: pkg.packageStatus === 4,
      isInTransit: pkg.packageStatus > 0 && pkg.packageStatus < 4,
      lastStatusUpdate: pkg.statusHistory.length > 0 ? pkg.statusHistory[pkg.statusHistory.length - 1].timestamp : pkg.updatedAt
    };
    
    console.log(`✅ Package details retrieved: ${pkg.trackingNumber}`);
    
    return NextResponse.json({
      success: true,
      data: packageDetails
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Package details fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch package details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/packages/[id] - Update package
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const updateData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Package ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Updating package: ${id}`, updateData);
    
    // Find package
    const pkg = await Package.findOne({
      $or: [
        { _id: id },
        { trackingNumber: id },
        { controlNumber: id },
        { packageID: id }
      ]
    });
    
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }
    
    // Store old values for history tracking
    const oldStatus = pkg.packageStatus;
    const oldWeight = pkg.weight;
    const oldBranch = pkg.branch;
    
    // Update package fields
    if (updateData.weight !== undefined) pkg.weight = updateData.weight;
    if (updateData.pieces !== undefined) pkg.pieces = updateData.pieces;
    if (updateData.description !== undefined) pkg.description = updateData.description.trim();
    if (updateData.shipper !== undefined) pkg.shipper = updateData.shipper.trim();
    if (updateData.branch !== undefined) pkg.branch = updateData.branch.trim();
    if (updateData.hsCode !== undefined) pkg.hsCode = updateData.hsCode.trim();
    if (updateData.serviceTypeID !== undefined) pkg.serviceTypeID = updateData.serviceTypeID;
    if (updateData.hazmatCodeID !== undefined) pkg.hazmatCodeID = updateData.hazmatCodeID;
    if (updateData.claimed !== undefined) pkg.claimed = updateData.claimed;
    if (updateData.discrepancy !== undefined) pkg.discrepancy = updateData.discrepancy;
    if (updateData.discrepancyDescription !== undefined) pkg.discrepancyDescription = updateData.discrepancyDescription;
    if (updateData.coloaded !== undefined) pkg.coloaded = updateData.coloaded;
    if (updateData.coloadIndicator !== undefined) pkg.coloadIndicator = updateData.coloadIndicator;
    if (updateData.packagePayments !== undefined) pkg.packagePayments = updateData.packagePayments;
    if (updateData.originalHouseNumber !== undefined) pkg.originalHouseNumber = updateData.originalHouseNumber;
    
    // Update dimensions
    if (updateData.dimensions) {
      pkg.dimensions = {
        cubes: updateData.dimensions.cubes ?? pkg.dimensions.cubes,
        length: updateData.dimensions.length ?? pkg.dimensions.length,
        width: updateData.dimensions.width ?? pkg.dimensions.width,
        height: updateData.dimensions.height ?? pkg.dimensions.height
      };
    }
    
    // Update customer information
    if (updateData.firstName !== undefined) pkg.firstName = updateData.firstName.trim();
    if (updateData.lastName !== undefined) pkg.lastName = updateData.lastName.trim();
    if (updateData.userCode !== undefined) {
      pkg.userCode = updateData.userCode.trim().toUpperCase();
      
      // Find and link new customer
      const customer = await Customer.findOne({ userCode: pkg.userCode });
      if (customer) {
        pkg.customerRef = customer._id;
        pkg.unknown = false;
      } else {
        pkg.unknown = true;
        console.warn(`⚠️ Customer not found for UserCode: ${pkg.userCode}`);
      }
    }
    
    // Handle status update with history
    if (updateData.packageStatus !== undefined && updateData.packageStatus !== oldStatus) {
      pkg.updateStatus(
        updateData.packageStatus,
        updateData.location || pkg.branch,
        updateData.statusNotes || `Status updated to ${getStatusName(updateData.packageStatus)}`,
        updateData.updatedBy || 'Admin'
      );
    }
    
    // Add general update to history if significant changes
    const significantChanges = [];
    if (updateData.weight !== undefined && updateData.weight !== oldWeight) {
      significantChanges.push(`Weight: ${oldWeight}kg → ${updateData.weight}kg`);
    }
    if (updateData.branch !== undefined && updateData.branch !== oldBranch) {
      significantChanges.push(`Branch: ${oldBranch} → ${updateData.branch}`);
    }
    
    if (significantChanges.length > 0) {
      pkg.statusHistory.push({
        status: pkg.packageStatus,
        timestamp: new Date(),
        location: pkg.branch,
        notes: `Package updated: ${significantChanges.join(', ')}`,
        updatedBy: updateData.updatedBy || 'Admin'
      });
    }
    
    pkg.updatedAt = new Date();
    await pkg.save();
    
    // Update customer package statistics if customer changed
    if (updateData.userCode !== undefined && pkg.customerRef) {
      const customer = await Customer.findById(pkg.customerRef);
      if (customer) {
        await customer.updatePackageStats();
        await customer.save();
      }
    }
    
    console.log(`✅ Package updated: ${pkg.trackingNumber}`);
    
    return NextResponse.json({
      success: true,
      message: 'Package updated successfully',
      data: pkg.toTasokoFormat(),
      changes: significantChanges
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Package update error:', error);
    
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
        message: 'Failed to update package',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/packages/[id] - Delete package
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Package ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Deleting package: ${id}`);
    
    // Find package
    const pkgToDelete = await Package.findOne({
      $or: [
        { _id: id },
        { trackingNumber: id },
        { controlNumber: id },
        { packageID: id }
      ]
    });
    
    if (!pkgToDelete) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }
    
    // Check if package can be deleted (business rules)
    if (pkgToDelete.packageStatus === 4 && pkgToDelete.claimed) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete delivered and claimed packages'
        },
        { status: 400 }
      );
    }
    
    // Store package data for response and customer update
    const packageData = {
      trackingNumber: pkgToDelete.trackingNumber,
      controlNumber: pkgToDelete.controlNumber,
      customerRef: pkgToDelete.customerRef
    };
    
    // Delete package
    await Package.findByIdAndDelete(pkgToDelete._id);
    
    // Update customer package statistics
    if (packageData.customerRef) {
      try {
        const customer = await Customer.findById(packageData.customerRef);
        if (customer) {
          await customer.updatePackageStats();
          await customer.save();
        }
      } catch (customerError) {
        console.error('Error updating customer stats after deletion:', customerError);
      }
    }
    
    console.log(`✅ Package deleted: ${packageData.trackingNumber}`);
    
    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
      deletedPackage: {
        trackingNumber: packageData.trackingNumber,
        controlNumber: packageData.controlNumber
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Package deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete package',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get status name
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