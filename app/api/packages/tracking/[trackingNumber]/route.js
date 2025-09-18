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
    const pkg = await Package.findOne({
      $or: [
        { trackingNumber: trackingNumber },
        { controlNumber: trackingNumber }
      ]
    }).populate('customerRef', 'userCode firstName lastName email phone address');
    
    if (!pkg) {
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
    if (pkg.manifestID) {
      manifestInfo = await Manifest.findOne({ manifestID: pkg.manifestID })
        .select('manifestCode flightDate awbNumber serviceTypeID manifestStatus');
    }
    
    // Format tracking response
    const trackingData = {
      success: true,
      "package": {
        // Basic Information
        trackingNumber: pkg.trackingNumber,
        controlNumber: pkg.controlNumber,
        packageID: pkg.packageID,
        
        // Customer Information
        customer: {
          name: pkg.customerName,
          userCode: pkg.userCode,
          firstName: pkg.firstName,
          lastName: pkg.lastName,
          email: pkg.customerRef?.email || null,
          phone: pkg.customerRef?.phone || null
        },
        
        // Package Details
        details: {
          weight: pkg.weight,
          dimensions: pkg.dimensions,
          pieces: pkg.pieces,
          description: pkg.description,
          shipper: pkg.shipper,
          branch: pkg.branch,
          hsCode: pkg.hsCode || null
        },
        
        // Current Status
        currentStatus: {
          status: pkg.packageStatus,
          statusName: pkg.statusName,
          claimed: pkg.claimed,
          unknown: pkg.unknown,
          discrepancy: pkg.discrepancy,
          discrepancyDescription: pkg.discrepancyDescription || null
        },
        
        // Service Information
        service: {
          serviceTypeID: pkg.serviceTypeID,
          serviceTypeName: pkg.serviceTypeName,
          hazmatCodeID: pkg.hazmatCodeID || null,
          coloaded: pkg.coloaded,
          coloadIndicator: pkg.coloadIndicator || null
        },
        
        // Dates
        dates: {
          entryDate: pkg.entryDate,
          entryDateTime: pkg.entryDateTime,
          createdAt: pkg.createdAt,
          updatedAt: pkg.updatedAt
        },
        
        // Status History
        statusHistory: pkg.statusHistory.map(history => ({
          status: history.status,
          statusName: getStatusName(history.status),
          timestamp: history.timestamp,
          location: history.location || null,
          notes: history.notes || null,
          updatedBy: history.updatedBy || 'System'
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        
        // Manifest Information
        manifest: manifestInfo ? {
          manifestID: pkg.manifestID,
          manifestCode: manifestInfo.manifestCode,
          flightDate: manifestInfo.flightDate,
          awbNumber: manifestInfo.awbNumber,
          manifestStatus: manifestInfo.manifestStatus,
          serviceTypeID: manifestInfo.serviceTypeID
        } : null,
        
        // Additional Information
        additional: {
          aiProcessed: pkg.aiProcessed,
          originalHouseNumber: pkg.originalHouseNumber || null,
          packagePayments: pkg.packagePayments || null,
          entryStaff: pkg.entryStaff || null
        }
      },
      
      // Tracking Summary
      summary: {
        isDelivered: pkg.packageStatus === 4,
        isInTransit: pkg.packageStatus > 0 && pkg.packageStatus < 4,
        isAtWarehouse: pkg.packageStatus === 0,
        hasDiscrepancy: pkg.discrepancy,
        isClaimed: pkg.claimed,
        isUnknown: pkg.unknown,
        totalStatusUpdates: pkg.statusHistory.length,
        daysInSystem: Math.floor((new Date() - pkg.entryDateTime) / (1000 * 60 * 60 * 24))
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
    const pkg = await Package.findOne({
      $or: [
        { trackingNumber: trackingNumber },
        { controlNumber: trackingNumber }
      ]
    });
    
    if (!pkg) {
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
      pkg.updateStatus(
        updateData.status,
        updateData.location || pkg.branch,
        updateData.notes || 'Status updated via API',
        updateData.updatedBy || 'API'
      );
    }
    
    // Update other fields if provided
    if (updateData.claimed !== undefined) {
      pkg.claimed = updateData.claimed;
    }
    
    if (updateData.discrepancy !== undefined) {
      pkg.discrepancy = updateData.discrepancy;
    }
    
    if (updateData.discrepancyDescription !== undefined) {
      pkg.discrepancyDescription = updateData.discrepancyDescription;
    }
    
    if (updateData.location && updateData.status === undefined) {
      // Location update without status change
      pkg.statusHistory.push({
        status: pkg.packageStatus,
        timestamp: new Date(),
        location: updateData.location,
        notes: updateData.notes || 'Location updated',
        updatedBy: updateData.updatedBy || 'API'
      });
    }
    
    await pkg.save();
    
    console.log(`✅ Package status updated: ${trackingNumber}`);
    
    // Return updated tracking information
    const updatedTrackingData = {
      success: true,
      message: 'Package updated successfully',
      "package": {
        trackingNumber: pkg.trackingNumber,
        controlNumber: pkg.controlNumber,
        currentStatus: {
          status: pkg.packageStatus,
          statusName: pkg.statusName,
          claimed: pkg.claimed,
          discrepancy: pkg.discrepancy
        },
        lastUpdate: pkg.updatedAt,
        statusHistory: pkg.statusHistory
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