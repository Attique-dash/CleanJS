import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Package from '../../../../lib/models/Package';
import Customer from '../../../../lib/models/Customer';

// POST /api/tasoko/packages - Add Package Endpoint (receives package data from Tasoko)
export async function POST(request) {
  try {
    await connectDB();
    
    const packagesData = await request.json();
    console.log('📥 Received package data from Tasoko:', packagesData);
    
    // Handle both single package and array of packages
    const packages = Array.isArray(packagesData) ? packagesData : [packagesData];
    
    let processedPackages = [];
    let errors = [];
    
    for (const packageData of packages) {
      try {
        // Validate required fields
        const requiredFields = ['TrackingNumber', 'ControlNumber', 'FirstName', 'LastName', 'UserCode', 'Weight', 'Shipper', 'Description', 'Branch'];
        const missingFields = requiredFields.filter(field => !packageData[field]);
        
        if (missingFields.length > 0) {
          errors.push(`Missing required fields for package: ${missingFields.join(', ')}`);
          continue;
        }
        
        // Check if package already exists
        const existingPackage = await Package.findOne({
          $or: [
            { trackingNumber: packageData.TrackingNumber },
            { controlNumber: packageData.ControlNumber }
          ]
        });
        
        if (existingPackage) {
          console.log(`⚠️ Package already exists: ${packageData.TrackingNumber}`);
          // Update existing package
          Object.assign(existingPackage, {
            courierID: packageData.CourierID || existingPackage.courierID,
            manifestID: packageData.ManifestID || existingPackage.manifestID,
            collectionID: packageData.CollectionID || existingPackage.collectionID,
            firstName: packageData.FirstName,
            lastName: packageData.LastName,
            userCode: packageData.UserCode,
            weight: packageData.Weight,
            shipper: packageData.Shipper,
            entryStaff: packageData.EntryStaff || existingPackage.entryStaff,
            entryDate: packageData.EntryDate ? new Date(packageData.EntryDate) : existingPackage.entryDate,
            entryDateTime: packageData.EntryDateTime ? new Date(packageData.EntryDateTime) : existingPackage.entryDateTime,
            branch: packageData.Branch,
            claimed: packageData.Claimed || false,
            apiToken: packageData.APIToken || existingPackage.apiToken,
            showControls: packageData.ShowControls || false,
            description: packageData.Description,
            hsCode: packageData.HSCode || '',
            unknown: packageData.Unknown || false,
            aiProcessed: packageData.AIProcessed || false,
            originalHouseNumber: packageData.OriginalHouseNumber || '',
            dimensions: {
              cubes: packageData.Cubes || 0,
              length: packageData.Length || 0,
              width: packageData.Width || 0,
              height: packageData.Height || 0
            },
            pieces: packageData.Pieces || 1,
            discrepancy: packageData.Discrepancy || false,
            discrepancyDescription: packageData.DiscrepancyDescription || '',
            serviceTypeID: packageData.ServiceTypeID || '',
            hazmatCodeID: packageData.HazmatCodeID || '',
            coloaded: packageData.Coloaded || false,
            coloadIndicator: packageData.ColoadIndicator || '',
            packageStatus: packageData.PackageStatus || 0,
            packagePayments: packageData.PackagePayments || ''
          });
          
          await existingPackage.save();
          processedPackages.push(existingPackage.toTasokoFormat());
          
        } else {
          // Create new package
          const newPackage = new Package({
            packageID: packageData.PackageID || undefined, // Let it auto-generate if not provided
            courierID: packageData.CourierID || '',
            manifestID: packageData.ManifestID || '',
            collectionID: packageData.CollectionID || '',
            trackingNumber: packageData.TrackingNumber,
            controlNumber: packageData.ControlNumber,
            firstName: packageData.FirstName,
            lastName: packageData.LastName,
            userCode: packageData.UserCode,
            weight: packageData.Weight,
            shipper: packageData.Shipper,
            entryStaff: packageData.EntryStaff || 'Tasoko API',
            entryDate: packageData.EntryDate ? new Date(packageData.EntryDate) : new Date(),
            entryDateTime: packageData.EntryDateTime ? new Date(packageData.EntryDateTime) : new Date(),
            branch: packageData.Branch,
            claimed: packageData.Claimed || false,
            apiToken: packageData.APIToken || process.env.TASOKO_API_TOKEN || 'default-token',
            showControls: packageData.ShowControls || false,
            description: packageData.Description,
            hsCode: packageData.HSCode || '',
            unknown: packageData.Unknown || false,
            aiProcessed: packageData.AIProcessed || false,
            originalHouseNumber: packageData.OriginalHouseNumber || '',
            dimensions: {
              cubes: packageData.Cubes || 0,
              length: packageData.Length || 0,
              width: packageData.Width || 0,
              height: packageData.Height || 0
            },
            pieces: packageData.Pieces || 1,
            discrepancy: packageData.Discrepancy || false,
            discrepancyDescription: packageData.DiscrepancyDescription || '',
            serviceTypeID: packageData.ServiceTypeID || '',
            hazmatCodeID: packageData.HazmatCodeID || '',
            coloaded: packageData.Coloaded || false,
            coloadIndicator: packageData.ColoadIndicator || '',
            packageStatus: packageData.PackageStatus || 0,
            packagePayments: packageData.PackagePayments || ''
          });
          
          await newPackage.save();
          console.log(`✅ New package created: ${newPackage.trackingNumber}`);
          
          // Find and link customer
          try {
            const customer = await Customer.findOne({ userCode: packageData.UserCode });
            if (customer) {
              newPackage.customerRef = customer._id;
              await newPackage.save();
              
              // Update customer package statistics
              await customer.updatePackageStats();
              await customer.save();
            } else {
              console.warn(`⚠️ Customer not found for UserCode: ${packageData.UserCode}`);
              newPackage.unknown = true;
              await newPackage.save();
            }
          } catch (customerError) {
            console.error('Error linking customer:', customerError);
          }
          
          processedPackages.push(newPackage.toTasokoFormat());
        }
        
      } catch (packageError) {
        console.error('Error processing package:', packageError);
        errors.push(`Failed to process package ${packageData.TrackingNumber || 'unknown'}: ${packageError.message}`);
      }
    }
    
    console.log(`📦 Processed ${processedPackages.length} packages from Tasoko`);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processedPackages.length} packages`,
      packages: processedPackages,
      errors: errors.length > 0 ? errors : null
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Tasoko add package error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process packages',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET /api/tasoko/packages - Optional endpoint to fetch packages for Tasoko
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const apiToken = searchParams.get('apiToken');
    const limit = parseInt(searchParams.get('limit')) || 100;
    const skip = parseInt(searchParams.get('skip')) || 0;
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');
    
    // Build query
    let query = {};
    
    if (status !== null && status !== undefined) {
      query.packageStatus = parseInt(status);
    }
    
    if (branch) {
      query.branch = branch;
    }
    
    // Fetch packages
    const packages = await Package.find(query)
      .sort({ entryDateTime: -1 })
      .limit(limit)
      .skip(skip)
      .populate('customerRef', 'userCode firstName lastName email');
    
    // Format for Tasoko API
    const formattedPackages = packages.map(pkg => pkg.toTasokoFormat());
    
    return NextResponse.json({
      success: true,
      packages: formattedPackages,
      total: formattedPackages.length,
      pagination: {
        limit,
        skip,
        hasMore: formattedPackages.length === limit
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Tasoko get packages error:', error);
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