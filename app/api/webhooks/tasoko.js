// ========================================
// app/api/webhooks/tasoko.js
// ========================================
import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/config/database';
import Package from '../../../lib/models/Package';
import Customer from '../../../lib/models/Customer';
import Manifest from '../../../lib/models/Manifest';

// POST /api/webhooks/tasoko - Handle Tasoko webhook notifications
export async function POST(request) {
  try {
    await connectDB();
    
    const webhookData = await request.json();
    console.log('🔔 Received Tasoko webhook:', webhookData);
    
    // Validate webhook signature/auth if needed
    const signature = request.headers.get('x-tasoko-signature');
    const apiToken = request.headers.get('x-api-token') || webhookData.apiToken;
    
    if (!apiToken) {
      return NextResponse.json(
        { success: false, message: 'Missing API token' },
        { status: 401 }
      );
    }
    
    // Process webhook based on type
    const { type, data } = webhookData;
    let result = {};
    
    switch (type) {
      case 'package.created':
        result = await handlePackageCreated(data);
        break;
        
      case 'package.updated':
        result = await handlePackageUpdated(data);
        break;
        
      case 'package.deleted':
        result = await handlePackageDeleted(data);
        break;
        
      case 'manifest.created':
        result = await handleManifestCreated(data);
        break;
        
      case 'manifest.updated':
        result = await handleManifestUpdated(data);
        break;
        
      case 'status.changed':
        result = await handleStatusChanged(data);
        break;
        
      case 'customer.sync':
        result = await handleCustomerSync(data);
        break;
        
      default:
        console.warn(`⚠️ Unknown webhook type: ${type}`);
        return NextResponse.json(
          { success: false, message: `Unknown webhook type: ${type}` },
          { status: 400 }
        );
    }
    
    console.log(`✅ Webhook processed successfully: ${type}`);
    
    return NextResponse.json({
      success: true,
      type,
      message: `Webhook ${type} processed successfully`,
      result
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Tasoko webhook error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Webhook processing failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Handle package created webhook
async function handlePackageCreated(data) {
  console.log('📦 Processing package created webhook:', data.TrackingNumber);
  
  // Find customer
  const customer = await Customer.findOne({ userCode: data.UserCode });
  
  const newPackage = new Package({
    packageID: data.PackageID,
    courierID: data.CourierID || '',
    manifestID: data.ManifestID || '',
    collectionID: data.CollectionID || '',
    trackingNumber: data.TrackingNumber,
    controlNumber: data.ControlNumber,
    firstName: data.FirstName,
    lastName: data.LastName,
    userCode: data.UserCode,
    weight: data.Weight,
    shipper: data.Shipper,
    entryStaff: data.EntryStaff || 'Tasoko Webhook',
    entryDate: data.EntryDate ? new Date(data.EntryDate) : new Date(),
    entryDateTime: data.EntryDateTime ? new Date(data.EntryDateTime) : new Date(),
    branch: data.Branch,
    claimed: data.Claimed || false,
    apiToken: data.APIToken,
    description: data.Description,
    customerRef: customer?._id || null,
    unknown: !customer
  });
  
  await newPackage.save();
  
  // Update customer stats if customer found
  if (customer) {
    await customer.updatePackageStats();
    await customer.save();
  }
  
  return { packageId: newPackage._id, trackingNumber: newPackage.trackingNumber };
}

// Handle package updated webhook
async function handlePackageUpdated(data) {
  console.log('🔄 Processing package updated webhook:', data.TrackingNumber);
  
  const package = await Package.findOne({
    $or: [
      { packageID: data.PackageID },
      { trackingNumber: data.TrackingNumber },
      { controlNumber: data.ControlNumber }
    ]
  });
  
  if (!package) {
    throw new Error(`Package not found: ${data.TrackingNumber}`);
  }
  
  const oldStatus = package.packageStatus;
  
  // Update package fields
  Object.assign(package, {
    weight: data.Weight ?? package.weight,
    shipper: data.Shipper || package.shipper,
    branch: data.Branch || package.branch,
    claimed: data.Claimed ?? package.claimed,
    description: data.Description || package.description,
    packageStatus: data.PackageStatus ?? package.packageStatus
  });
  
  // Add status history if status changed
  if (data.PackageStatus !== undefined && oldStatus !== data.PackageStatus) {
    package.updateStatus(
      data.PackageStatus,
      package.branch,
      'Status updated via webhook',
      'Tasoko Webhook'
    );
  }
  
  await package.save();
  
  return { packageId: package._id, trackingNumber: package.trackingNumber };
}

// Handle package deleted webhook
async function handlePackageDeleted(data) {
  console.log('🗑️ Processing package deleted webhook:', data.TrackingNumber);
  
  const package = await Package.findOne({
    $or: [
      { packageID: data.PackageID },
      { trackingNumber: data.TrackingNumber },
      { controlNumber: data.ControlNumber }
    ]
  });
  
  if (!package) {
    throw new Error(`Package not found: ${data.TrackingNumber}`);
  }
  
  const customerRef = package.customerRef;
  const trackingNumber = package.trackingNumber;
  
  await Package.findByIdAndDelete(package._id);
  
  // Update customer stats
  if (customerRef) {
    const customer = await Customer.findById(customerRef);
    if (customer) {
      await customer.updatePackageStats();
      await customer.save();
    }
  }
  
  return { deletedPackage: trackingNumber };
}

// Handle manifest created webhook
async function handleManifestCreated(data) {
  console.log('📋 Processing manifest created webhook:', data.ManifestCode);
  
  const manifest = data.Manifest;
  
  const newManifest = new Manifest({
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
    apiToken: data.APIToken
  });
  
  await newManifest.save();
  
  return { manifestId: newManifest._id, manifestCode: newManifest.manifestCode };
}

// Handle manifest updated webhook
async function handleManifestUpdated(data) {
  console.log('🔄 Processing manifest updated webhook:', data.Manifest.ManifestCode);
  
  const manifestData = data.Manifest;
  
  const manifest = await Manifest.findOne({ manifestID: manifestData.ManifestID });
  
  if (!manifest) {
    throw new Error(`Manifest not found: ${manifestData.ManifestID}`);
  }
  
  const oldStatus = manifest.manifestStatus;
  
  // Update manifest
  Object.assign(manifest, {
    weight: manifestData.Weight,
    itemCount: manifestData.ItemCount,
    manifestStatus: manifestData.ManifestStatus,
    flightDate: new Date(manifestData.FlightDate)
  });
  
  // Add status history if status changed
  if (oldStatus !== manifestData.ManifestStatus) {
    manifest.updateStatus(
      manifestData.ManifestStatus,
      'Warehouse',
      'Status updated via webhook',
      'Tasoko Webhook'
    );
  }
  
  await manifest.save();
  
  return { manifestId: manifest._id, manifestCode: manifest.manifestCode };
}

// Handle status changed webhook
async function handleStatusChanged(data) {
  console.log('📊 Processing status changed webhook');
  
  const { packageIds, manifestIds, newStatus, location, notes } = data;
  let updatedCount = 0;
  
  // Update packages
  if (packageIds && Array.isArray(packageIds)) {
    const packages = await Package.find({ _id: { $in: packageIds } });
    
    for (const pkg of packages) {
      pkg.updateStatus(
        newStatus,
        location || pkg.branch,
        notes || 'Status updated via webhook',
        'Tasoko Webhook'
      );
      await pkg.save();
      updatedCount++;
    }
  }
  
  // Update manifests
  if (manifestIds && Array.isArray(manifestIds)) {
    const manifests = await Manifest.find({ _id: { $in: manifestIds } });
    
    for (const manifest of manifests) {
      manifest.updateStatus(
        newStatus,
        location || 'Warehouse',
        notes || 'Status updated via webhook',
        'Tasoko Webhook'
      );
      await manifest.save();
      updatedCount++;
    }
  }
  
  return { updatedCount };
}

// Handle customer sync webhook
async function handleCustomerSync(data) {
  console.log('👥 Processing customer sync webhook');
  
  const { customers } = data;
  let syncedCount = 0;
  let updatedCount = 0;
  
  for (const customerData of customers) {
    const existingCustomer = await Customer.findOne({ userCode: customerData.UserCode });
    
    if (existingCustomer) {
      // Update existing
      existingCustomer.firstName = customerData.FirstName;
      existingCustomer.lastName = customerData.LastName;
      existingCustomer.branch = customerData.Branch;
      await existingCustomer.save();
      updatedCount++;
    } else {
      // Create new
      const newCustomer = new Customer({
        userCode: customerData.UserCode,
        firstName: customerData.FirstName,
        lastName: customerData.LastName,
        branch: customerData.Branch,
        createdBy: 'Tasoko Webhook'
      });
      await newCustomer.save();
      syncedCount++;
    }
  }
  
  return { syncedCount, updatedCount };
}

// GET /api/webhooks/tasoko - Get webhook info
export async function GET(request) {
  return NextResponse.json({
    success: true,
    message: 'Tasoko webhook endpoint is active',
    supportedTypes: [
      'package.created',
      'package.updated', 
      'package.deleted',
      'manifest.created',
      'manifest.updated',
      'status.changed',
      'customer.sync'
    ]
  }, { status: 200 });
}