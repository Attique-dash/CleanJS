// app/api/tasoko/packages/update/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/config/database';
import Package from '../../../../../lib/models/Package';
import Customer from '../../../../../lib/models/Customer';

// POST /api/tasoko/packages/update - Update Package Endpoint
export async function POST(request) {
  try {
    await connectDB();
    
    const packagesData = await request.json();
    console.log('🔄 Received package update from Tasoko:', packagesData);
    
    // Handle both single package and array of packages
    const packages = Array.isArray(packagesData) ? packagesData : [packagesData];
    
    let updatedPackages = [];
    let errors = [];
    
    for (const packageData of packages) {
      try {
        // Find package by PackageID, TrackingNumber, or ControlNumber
        const existingPackage = await Package.findOne({
          $or: [
            { packageID: packageData.PackageID },
            { trackingNumber: packageData.TrackingNumber },
            { controlNumber: packageData.ControlNumber }
          ]
        });
        
        if (!existingPackage) {
          errors.push(`Package not found: ${packageData.PackageID || packageData.TrackingNumber || packageData.ControlNumber}`);
          continue;
        }
        
        console.log(`🔄 Updating package: ${existingPackage.trackingNumber}`);
        
        // Store old status for comparison
        const oldStatus = existingPackage.packageStatus;
        
        // Update package fields
        Object.assign(existingPackage, {
          courierID: packageData.CourierID || existingPackage.courierID,
          manifestID: packageData.ManifestID || existingPackage.manifestID,
          collectionID: packageData.CollectionID || existingPackage.collectionID,
          firstName: packageData.FirstName || existingPackage.firstName,
          lastName: packageData.LastName || existingPackage.lastName,
          userCode: packageData.UserCode || existingPackage.userCode,
          weight: packageData.Weight ?? existingPackage.weight,
          shipper: packageData.Shipper || existingPackage.shipper,
          entryStaff: packageData.EntryStaff || existingPackage.entryStaff,
          branch: packageData.Branch || existingPackage.branch,
          claimed: packageData.Claimed ?? existingPackage.claimed,
          showControls: packageData.ShowControls ?? existingPackage.showControls,
          description: packageData.Description || existingPackage.description,
          hsCode: packageData.HSCode ?? existingPackage.hsCode,
          unknown: packageData.Unknown ?? existingPackage.unknown,
          aiProcessed: packageData.AIProcessed ?? existingPackage.aiProcessed,
          originalHouseNumber: packageData.OriginalHouseNumber ?? existingPackage.originalHouseNumber,
          pieces: packageData.Pieces ?? existingPackage.pieces,
          discrepancy: packageData.Discrepancy ?? existingPackage.discrepancy,
          discrepancyDescription: packageData.DiscrepancyDescription || existingPackage.discrepancyDescription,
          serviceTypeID: packageData.ServiceTypeID ?? existingPackage.serviceTypeID,
          hazmatCodeID: packageData.HazmatCodeID ?? existingPackage.hazmatCodeID,
          coloaded: packageData.Coloaded ?? existingPackage.coloaded,
          coloadIndicator: packageData.ColoadIndicator || existingPackage.coloadIndicator,
          packageStatus: packageData.PackageStatus ?? existingPackage.packageStatus,
          packagePayments: packageData.PackagePayments || existingPackage.packagePayments
        });
        
        // Update dimensions if provided
        if (packageData.Cubes !== undefined || packageData.Length !== undefined || 
            packageData.Width !== undefined || packageData.Height !== undefined) {
          existingPackage.dimensions = {
            cubes: packageData.Cubes ?? existingPackage.dimensions.cubes,
            length: packageData.Length ?? existingPackage.dimensions.length,
            width: packageData.Width ?? existingPackage.dimensions.width,
            height: packageData.Height ?? existingPackage.dimensions.height
          };
        }
        
        // Update dates if provided
        if (packageData.EntryDate) {
          existingPackage.entryDate = new Date(packageData.EntryDate);
        }
        if (packageData.EntryDateTime) {
          existingPackage.entryDateTime = new Date(packageData.EntryDateTime);
        }
        
        // Add status history if status changed
        const newStatus = packageData.PackageStatus ?? existingPackage.packageStatus;
        if (oldStatus !== newStatus) {
          existingPackage.updateStatus(
            newStatus,
            existingPackage.branch,
            'Status updated via Tasoko API',
            'Tasoko API'
          );
        }
        
        await existingPackage.save();
        
        // Update customer reference if userCode changed
        if (packageData.UserCode && packageData.UserCode !== existingPackage.userCode) {
          const customer = await Customer.findOne({ userCode: packageData.UserCode });
          if (customer) {
            existingPackage.customerRef = customer._id;
            await existingPackage.save();
            
            // Update both old and new customer stats
            await customer.updatePackageStats();
            await customer.save();
          }
        }
        
        updatedPackages.push(existingPackage.toTasokoFormat());
        console.log(`✅ Package updated: ${existingPackage.trackingNumber}`);
        
      } catch (packageError) {
        console.error('Error updating package:', packageError);
        errors.push(`Failed to update package ${packageData.PackageID || packageData.TrackingNumber || 'unknown'}: ${packageError.message}`);
      }
    }
    
    console.log(`🔄 Updated ${updatedPackages.length} packages from Tasoko`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedPackages.length} packages`,
      packages: updatedPackages,
      errors: errors.length > 0 ? errors : null
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Tasoko update package error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update packages',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}