import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/config/database';
import Package from '../../../../../lib/models/Package';
import Customer from '../../../../../lib/models/Customer';

// POST /api/tasoko/packages/delete - Delete Package Endpoint
export async function POST(request) {
  try {
    await connectDB();
    
    const packagesData = await request.json();
    console.log('🗑️ Received package deletion request from Tasoko:', packagesData);
    
    // Handle both single package and array of packages
    const packages = Array.isArray(packagesData) ? packagesData : [packagesData];
    
    let deletedPackages = [];
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
        
        console.log(`🗑️ Deleting package: ${existingPackage.trackingNumber}`);
        
        // Store package data for response before deletion
        const deletedPackageData = existingPackage.toTasokoFormat();
        const customerRef = existingPackage.customerRef;
        
        // Delete the package
        await Package.findByIdAndDelete(existingPackage._id);
        
        // Update customer package statistics
        if (customerRef) {
          try {
            const customer = await Customer.findById(customerRef);
            if (customer) {
              await customer.updatePackageStats();
              await customer.save();
            }
          } catch (customerError) {
            console.error('Error updating customer stats after deletion:', customerError);
          }
        }
        
        deletedPackages.push(deletedPackageData);
        console.log(`✅ Package deleted: ${existingPackage.trackingNumber}`);
        
      } catch (packageError) {
        console.error('Error deleting package:', packageError);
        errors.push(`Failed to delete package ${packageData.PackageID || packageData.TrackingNumber || 'unknown'}: ${packageError.message}`);
      }
    }
    
    console.log(`🗑️ Deleted ${deletedPackages.length} packages from Tasoko`);
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedPackages.length} packages`,
      packages: deletedPackages,
      errors: errors.length > 0 ? errors : null
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Tasoko delete package error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete packages',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET /api/tasoko/packages/delete - Optional endpoint to get deletion history
export async function GET(request) {
  try {
    await connectDB();
    
    // This could be implemented to track deletion history
    // For now, we'll return a simple response
    return NextResponse.json({
      success: true,
      message: 'Package deletion endpoint is active',
      info: 'Use POST method to delete packages'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Tasoko delete package GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process request',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}