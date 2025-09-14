import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Manifest from '../../../../lib/models/Manifest';
import Package from '../../../../lib/models/Package';

// POST /api/tasoko/manifest - Update Manifest Endpoint
export async function POST(request) {
  try {
    await connectDB();
    
    const manifestData = await request.json();
    console.log('📋 Received manifest update from Tasoko:', manifestData);
    
    // Validate required fields
    if (!manifestData.APIToken || !manifestData.Manifest) {
      return NextResponse.json(
        { success: false, message: 'APIToken and Manifest data are required' },
        { status: 400 }
      );
    }
    
    const manifest = manifestData.Manifest;
    
    // Validate manifest required fields
    const requiredFields = ['ManifestID', 'CourierID', 'ServiceTypeID', 'ManifestCode', 'FlightDate', 'Weight', 'ItemCount', 'ManifestNumber', 'StaffName', 'EntryDate', 'EntryDateTime', 'AWBNumber'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    try {
      // Find existing manifest or create new one
      let existingManifest = await Manifest.findOne({ 
        manifestID: manifest.ManifestID 
      });
      
      if (existingManifest) {
        console.log(`🔄 Updating existing manifest: ${manifest.ManifestCode}`);
        
        // Store old status for comparison
        const oldStatus = existingManifest.manifestStatus;
        
        // Update manifest fields
        Object.assign(existingManifest, {
          courierID: manifest.CourierID,
          serviceTypeID: manifest.ServiceTypeID,
          manifestStatus: manifest.ManifestStatus || existingManifest.manifestStatus,
          manifestCode: manifest.ManifestCode,
          flightDate: new Date(manifest.FlightDate),
          weight: manifest.Weight,
          itemCount: manifest.ItemCount,
          manifestNumber: manifest.ManifestNumber,
          staffName: manifest.StaffName,
          entryDate: new Date(manifest.EntryDate),
          entryDateTime: new Date(manifest.EntryDateTime),
          awbNumber: manifest.AWBNumber,
          apiToken: manifestData.APIToken
        });
        
        // Add status history if status changed
        if (oldStatus !== manifest.ManifestStatus) {
          existingManifest.updateStatus(
            manifest.ManifestStatus,
            'Warehouse',
            'Status updated via Tasoko API',
            manifest.StaffName || 'Tasoko API'
          );
        }
        
        await existingManifest.save();
        
      } else {
        console.log(`📋 Creating new manifest: ${manifest.ManifestCode}`);
        
        // Create new manifest
        existingManifest = new Manifest({
          manifestID: manifest.ManifestID,
          courierID: manifest.CourierID,
          serviceTypeID: manifest.ServiceTypeID,
          manifestStatus: manifest.ManifestStatus || "0",
          manifestCode: manifest.ManifestCode,
          flightDate: new Date(manifest.FlightDate),
          weight: manifest.Weight,
          itemCount: manifest.ItemCount,
          manifestNumber: manifest.ManifestNumber,
          staffName: manifest.StaffName,
          entryDate: new Date(manifest.EntryDate),
          entryDateTime: new Date(manifest.EntryDateTime),
          awbNumber: manifest.AWBNumber,
          apiToken: manifestData.APIToken
        });
        
        await existingManifest.save();
      }
      
      // Update associated packages
      let updatedPackages = 0;
      
      // Update packages by Collection Codes
      if (manifestData.CollectionCodes && Array.isArray(manifestData.CollectionCodes)) {
        for (const collectionCode of manifestData.CollectionCodes) {
          const result = await Package.updateMany(
            { collectionID: collectionCode },
            { 
              manifestID: manifest.ManifestID,
              $addToSet: { 
                statusHistory: {
                  status: parseInt(manifest.ManifestStatus) || 0,
                  timestamp: new Date(),
                  location: 'Manifest Processing',
                  notes: `Added to manifest ${manifest.ManifestCode}`,
                  updatedBy: manifest.StaffName || 'Tasoko API'
                }
              }
            }
          );
          updatedPackages += result.modifiedCount;
        }
      }
      
      // Update packages by AWB Numbers
      if (manifestData.PackageAWBs && Array.isArray(manifestData.PackageAWBs)) {
        for (const awb of manifestData.PackageAWBs) {
          const result = await Package.updateMany(
            { controlNumber: awb },
            { 
              manifestID: manifest.ManifestID,
              $addToSet: { 
                statusHistory: {
                  status: parseInt(manifest.ManifestStatus) || 0,
                  timestamp: new Date(),
                  location: 'Manifest Processing',
                  notes: `Added to manifest ${manifest.ManifestCode}`,
                  updatedBy: manifest.StaffName || 'Tasoko API'
                }
              }
            }
          );
          updatedPackages += result.modifiedCount;
        }
      }
      
      // Update manifest with associated packages
      const associatedPackages = await Package.find({ 
        manifestID: manifest.ManifestID 
      }).select('_id');
      
      existingManifest.packages = associatedPackages.map(pkg => pkg._id);
      await existingManifest.save();
      
      console.log(`✅ Manifest processed: ${manifest.ManifestCode}, Updated ${updatedPackages} packages`);
      
      return NextResponse.json({
        success: true,
        message: `Manifest ${manifest.ManifestCode} processed successfully`,
        manifest: existingManifest.toTasokoFormat(),
        packagesUpdated: updatedPackages,
        associatedPackages: associatedPackages.length
      }, { status: 200 });
      
    } catch (manifestError) {
      console.error('Error processing manifest:', manifestError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to process manifest: ${manifestError.message}`,
          error: process.env.NODE_ENV === 'development' ? manifestError.message : 'Manifest processing error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Tasoko manifest endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process manifest',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET /api/tasoko/manifest - Get manifests
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const manifestID = searchParams.get('manifestID');
    const courierID = searchParams.get('courierID');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;
    
    // Build query
    let query = {};
    
    if (manifestID) {
      query.manifestID = manifestID;
    }
    
    if (courierID) {
      query.courierID = courierID;
    }
    
    // Fetch manifests
    const manifests = await Manifest.find(query)
      .sort({ entryDateTime: -1 })
      .limit(limit)
      .skip(skip)
      .populate('packages', 'trackingNumber controlNumber packageStatus weight');
    
    // Format for response
    const formattedManifests = manifests.map(manifest => ({
      ...manifest.toTasokoFormat(),
      PackageCount: manifest.packages?.length || 0,
      StatusName: manifest.statusName,
      ServiceTypeName: manifest.serviceTypeName
    }));
    
    return NextResponse.json({
      success: true,
      manifests: formattedManifests,
      total: formattedManifests.length,
      pagination: {
        limit,
        skip,
        hasMore: formattedManifests.length === limit
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Tasoko get manifests error:', error);
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