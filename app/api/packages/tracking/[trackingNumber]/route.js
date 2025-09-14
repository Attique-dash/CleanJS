import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/config/database';
import Package from '../../../../../lib/models/Package';
import Customer from '../../../../../lib/models/Customer';
import Manifest from '../../../../../lib/models/Manifest';

// GET /api/packages/tracking/[trackingNumber] - Track a package
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { trackingNumber } = params;
    
    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, message: 'Tracking number is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Tracking package: ${trackingNumber}`);
    
    // Find package by tracking number or control number
    const package = await Package.findOne({
      $or: [
        { trackingNumber: trackingNumber },
        { controlNumber: trackingNumber }
      ]
    }).populate('customerRef', 'userCode firstName lastName email phone address');
    
    if (!package) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package not found',
          trackingNumber: trackingNumber
        },
        { status: 404 }
      );
    }
    
    // Get manifest information if available
    let manifestInfo = null;
    if (package.manifestID) {
      manifestInfo = await Manifest.findOne({ manifestID: package.manifestID })
        .select('manifestCode flightDate awbNumber serviceTypeID manifestStatus');
    }
    
    // Format tracking response
    const trackingData = {
      success: true,
      package: {
        // Basic Information
        trackingNumber: package.trackingNumber,
        controlNumber: package.controlNumber,
        packageID: package.packageID,
        
        // Customer Information
        customer: {
          name: package.customerName,
          userCode: package.userCode,
          firstName: package.firstName,
          lastName: package.lastName,
          email: package.customerRef?.email || null,
          phone: package.customerRef?.phone || null
        },
        
        // Package Details
        details: {
          weight: package.weight,
          dimensions: package.dimensions,
          pieces: package.pieces,
          description: package.description,
          shipper: package.shipper,
          branch: package.branch,
          hsCode: package.hsCode || null
        },
        
        // Current Status
        currentStatus: {
          status: package.packageStatus,
          statusName: package.statusName,
          claimed: package.claimed,
          unknown: package.unknown,
          discrepancy: package.discrepancy,
          discrepancyDescription: package.discrepancyDescription || null
        },
        
        // Service Information
        service: {
          serviceTypeID: package.serviceTypeID,
          serviceTypeName: package.serviceTypeName,
          hazmatCodeID: package.hazmatCodeID || null,
          coloaded: package.coloaded,
          coloadIndicator: package.coloadIndicator || null
        },
        
        // Dates
        dates: {
          entryDate: package.entryDate,
          entryDateTime: package.entryDateTime,
          createdAt: package.createdAt,
          updatedAt: package.updatedAt
        },
        
        // Status History
        statusHistory: package.statusHistory.map(history => ({
          status: history.status,
          statusName: getStatusName(history.status),
          timestamp: history.timestamp,
          location: history.location || null,
          notes: history.notes || null,
          updatedBy: history.updatedBy || 'System'
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        
        // Manifest Information
        manifest: manifestInfo ? {
          manifestID: package.manifestID,
          manifestCode: manifestInfo.manifestCode,
          flightDate: manifestInfo.flightDate,
          awbNumber: manifestInfo.awbNumber,
          manifestStatus: manifestInfo.manifestStatus,
          serviceTypeID: manifestInfo.serviceTypeID
        } : null,
        
        // Additional Information
        additional: {
          aiProcessed: package.aiProcessed,
          originalHouseNumber: package.originalHouseNumber || null,
          packagePayments: package.packagePayments || null,
          entryStaff: package.entryStaff || null
        }
      },
      
      // Tracking Summary
      summary: {
        isDelivered: package.packageStatus === 4,
        isInTransit: package.packageStatus > 0 && package.packageStatus < 4,
        isAtWarehouse: package.packageStatus === 0,
        hasDiscrepancy: package.discrepancy,
        isClaimed: package.claimed,
        isUnknown: package.unknown,
        totalStatusUpdates: package.statusHistory.length,
        daysInSystem: Math.floor((new Date() - package.entryDateTime) / (1000 * 60 * 60 * 24))
      }
    };
    
    console.log(`✅ Package tracking data retrieved: ${trackingNumber}`);
    
    return NextResponse.json(trackingData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Package tracking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve tracking information',
        trackingNumber: params.trackingNumber,
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

// POST /api/packages/tracking/[trackingNumber] - Update package status
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const { trackingNumber } = params;
    const updateData = await request.json();
    
    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, message: 'Tracking number is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Updating package status: ${trackingNumber}`, updateData);
    
    // Find package
    const package = await Package.findOne({
      $or: [
        { trackingNumber: trackingNumber },
        { controlNumber: trackingNumber }
      ]
    });
    
    if (!package) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }
    
    // Validate status
    if (updateData.status !== undefined) {
      if (![0, 1, 2, 3, 4].includes(updateData.status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid status. Must be 0-4' },
          { status: 400 }
        );
      }
      
      // Update status with history
      package.updateStatus(
        updateData.status,
        updateData.location || package.branch,
        updateData.notes || 'Status updated via API',
        updateData.updatedBy || 'API'
      );
    }
    
    // Update other fields if provided
    if (updateData.claimed !== undefined) {
      package.claimed = updateData.claimed;
    }
    
    if (updateData.discrepancy !== undefined) {
      package.discrepancy = updateData.discrepancy;
    }
    
    if (updateData.discrepancyDescription !== undefined) {
      package.discrepancyDescription = updateData.discrepancyDescription;
    }
    
    if (updateData.location && updateData.status === undefined) {
      // Location update without status change
      package.statusHistory.push({
        status: package.packageStatus,
        timestamp: new Date(),
        location: updateData.location,
        notes: updateData.notes || 'Location updated',
        updatedBy: updateData.updatedBy || 'API'
      });
    }
    
    await package.save();
    
    console.log(`✅ Package status updated: ${trackingNumber}`);
    
    // Return updated tracking information
    const updatedTrackingData = {
      success: true,
      message: 'Package updated successfully',
      package: {
        trackingNumber: package.trackingNumber,
        controlNumber: package.controlNumber,
        currentStatus: {
          status: package.packageStatus,
          statusName: package.statusName,
          claimed: package.claimed,
          discrepancy: package.discrepancy
        },
        lastUpdate: package.updatedAt,
        statusHistory: package.statusHistory
          .slice(-5) // Return last 5 status updates
          .map(history => ({
            status: history.status,
            statusName: getStatusName(history.status),
            timestamp: history.timestamp,
            location: history.location,
            notes: history.notes,
            updatedBy: history.updatedBy
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }
    };
    
    return NextResponse.json(updatedTrackingData, { status: 200 });

  } catch (error) {
    console.error('❌ Package status update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update package status',
        trackingNumber: params.trackingNumber,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}