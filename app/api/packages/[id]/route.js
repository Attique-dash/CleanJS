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
    const package = await Package.findOne({
      $or: [
        { _id: id },
        { trackingNumber: id },
        { controlNumber: id },
        { packageID: id }
      ]
    }).populate('customerRef', 'userCode firstName lastName email phone address branch');
    
    if (!package) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }
    
    // Get manifest information if available
    let manifestInfo = null;
    if (package.manifestID) {
      manifestInfo = await Manifest.findOne({ manifestID: package.manifestID })
        .select('manifestCode flightDate awbNumber serviceTypeID manifestStatus staffName');
    }
    
    // Format package details
    const packageDetails = {
      // Basic Package Information
      _id: package._id,
      packageID: package.packageID,
      trackingNumber: package.trackingNumber,
      controlNumber: package.controlNumber,
      
      // Customer Information
      customer: {
        _id: package.customerRef?._id,
        userCode: package.userCode,
        firstName: package.firstName,
        lastName: package.lastName,
        fullName: `${package.firstName} ${package.lastName}`,
        email: package.customerRef?.email,
        phone: package.customerRef?.phone,
        address: package.customerRef?.address
      },
      
      // Package Details
      weight: package.weight,
      dimensions: package.dimensions,
      pieces: package.pieces,
      description: package.description,
      shipper: package.shipper,
      branch: package.branch,
      hsCode: package.hsCode,
      
      // Status Information
      packageStatus: package.packageStatus,
      statusName: package.statusName,
      claimed: package.claimed,
      unknown: package.unknown,
      discrepancy: package.discrepancy,
      discrepancyDescription: package.discrepancyDescription,
      
      // Service Information
      serviceTypeID: package.serviceTypeID,
      serviceTypeName: package.serviceTypeName,
      hazmatCodeID: package.hazmatCodeID,
      hazmatName: package.hazmatName,
      coloaded: package.coloaded,
      coloadIndicator: package.coloadIndicator,
      
      // Dates and Entry
      entryDate: package.entryDate,
      entryDateTime: package.entryDateTime,
      entryStaff: package.entryStaff,
      createdAt: package.createdAt,
      updatedAt: package.updatedAt,
      
      // Status History
      statusHistory: package.statusHistory.map(history => ({
        status: history.status,
        statusName: getStatusName(history.status),
        timestamp: history.timestamp,
        location: history.location,
        notes: history.notes,
        updatedBy: history.updatedBy
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      
      // Manifest Information
      manifest: manifestInfo ? {
        manifestID: package.manifestID,
        manifestCode: manifestInfo.manifestCode,
        flightDate: manifestInfo.flightDate,
        awbNumber: manifestInfo.awbNumber,
        manifestStatus: manifestInfo.manifestStatus,
        serviceTypeID: manifestInfo.serviceTypeID,
        staffName: manifestInfo.staffName
      } : null,
      
      // Additional Fields
      courierID: package.courierID,
      collectionID: package.collectionID,
      apiToken: package.apiToken ? '***masked***' : null,
      showControls: package.showControls,
      aiProcessed: package.aiProcessed,
      originalHouseNumber: package.originalHouseNumber,
      packagePayments: package.packagePayments,
      
      // Calculated Fields
      daysInSystem: Math.floor((new Date() - package.entryDateTime) / (1000 * 60 * 60 * 24)),
      isDelivered: package.packageStatus === 4,
      isInTransit: package.packageStatus > 0 && package.packageStatus < 4,
      lastStatusUpdate: package.statusHistory.length > 0 ? package.statusHistory[package.statusHistory.length - 1].timestamp : package.updatedAt
    };
    
    console.log(`✅ Package details retrieved: ${package.trackingNumber}`);
    
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
    const package = await Package.findOne({
      $or: [
        { _id: id },
        { trackingNumber: id },
        { controlNumber: id },
        { packageID: id }
      ]
    });
    
    if (!package) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }
    
    // Store old values for history tracking
    const oldStatus = package.packageStatus;
    const oldWeight = package.weight;
    const oldBranch = package.branch;
    
    // Update package fields
    if (updateData.weight !== undefined) package.weight = updateData.weight;
    if (updateData.pieces !== undefined) package.pieces = updateData.pieces;
    if (updateData.description !== undefined) package.description = updateData.description.trim();
    if (updateData.shipper !== undefined) package.shipper = updateData.shipper.trim();
    if (updateData.branch !== undefined) package.branch = updateData.branch.trim();
    if (updateData.hsCode !== undefined) package.hsCode = updateData.hsCode.trim();
    if (updateData.serviceTypeID !== undefined) package.serviceTypeID = updateData.serviceTypeID;
    if (updateData.hazmatCodeID !== undefined) package.hazmatCodeID = updateData.hazmatCodeID;
    if (updateData.claimed !== undefined) package.claimed = updateData.claimed;
    if (updateData.discrepancy !== undefined) package.discrepancy = updateData.discrepancy;
    if (updateData.discrepancyDescription !== undefined) package.discrepancyDescription = updateData.discrepancyDescription;
    if (updateData.coloaded !== undefined) package.coloaded = updateData.coloaded;
    if (updateData.coloadIndicator !== undefined) package.coloadIndicator = updateData.coloadIndicator;
    if (updateData.packagePayments !== undefined) package.packagePayments = updateData.packagePayments;
    if (updateData.originalHouseNumber !== undefined) package.originalHouseNumber = updateData.originalHouseNumber;
    
    // Update dimensions
    if (updateData.dimensions) {
      package.dimensions = {
        cubes: updateData.dimensions.cubes ?? package.dimensions.cubes,
        length: updateData.dimensions.length ?? package.dimensions.length,
        width: updateData.dimensions.width ?? package.dimensions.width,
        height: updateData.dimensions.height ?? package.dimensions.height
      };
    }
    
    // Update customer information
    if (updateData.firstName !== undefined) package.firstName = updateData.firstName.trim();
    if (updateData.lastName !== undefined) package.lastName = updateData.lastName.trim();
    if (updateData.userCode !== undefined) {
      package.userCode = updateData.userCode.trim().toUpperCase();
      
      // Find and link new customer
      const customer = await Customer.findOne({ userCode: package.userCode });
      if (customer) {
        package.customerRef = customer._id;
        package.unknown = false;
      } else {
        package.unknown = true;
        console.warn(`⚠️ Customer not found for UserCode: ${package.userCode}`);
      }
    }
    
    // Handle status update with history
    if (updateData.packageStatus !== undefined && updateData.packageStatus !== oldStatus) {
      package.updateStatus(
        updateData.packageStatus,
        updateData.location || package.branch,
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
      package.statusHistory.push({
        status: package.packageStatus,
        timestamp: new Date(),
        location: package.branch,
        notes: `Package updated: ${significantChanges.join(', ')}`,
        updatedBy: updateData.updatedBy || 'Admin'
      });
    }
    
    package.updatedAt = new Date();
    await package.save();
    
    // Update customer package statistics if customer changed
    if (updateData.userCode !== undefined && package.customerRef) {
      const customer = await Customer.findById(package.customerRef);
      if (customer) {
        await customer.updatePackageStats();
        await customer.save();
      }
    }
    
    console.log(`✅ Package updated: ${package.trackingNumber}`);
    
    return NextResponse.json({
      success: true,
      message: 'Package updated successfully',
      data: package.toTasokoFormat(),
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
    const package = await Package.findOne({
      $or: [
        { _id: id },
        { trackingNumber: id },
        { controlNumber: id },
        { packageID: id }
      ]
    });
    
    if (!package) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }
    
    // Check if package can be deleted (business rules)
    if (package.packageStatus === 4 && package.claimed) {
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
      trackingNumber: package.trackingNumber,
      controlNumber: package.controlNumber,
      customerRef: package.customerRef
    };
    
    // Delete package
    await Package.findByIdAndDelete(package._id);
    
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