// ========================================
// app/api/packages/bulk/route.js
// ========================================
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Package from '../../../../lib/models/Package';
import Customer from '../../../../lib/models/Customer';

// POST /api/packages/bulk - Bulk operations on packages
export async function POST(request) {
  try {
    await connectDB();
    
    const { operation, packageIds, data } = await request.json();
    
    if (!operation || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Operation and package IDs are required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Bulk ${operation} operation for ${packageIds.length} packages`);
    
    let result = { modifiedCount: 0, errors: [] };
    
    switch (operation) {
      case 'update_status':
        result = await bulkUpdateStatus(packageIds, data);
        break;
        
      case 'update_branch':
        result = await bulkUpdateBranch(packageIds, data);
        break;
        
      case 'mark_claimed':
        result = await bulkMarkClaimed(packageIds, data);
        break;
        
      case 'mark_unclaimed':
        result = await bulkMarkUnclaimed(packageIds, data);
        break;
        
      case 'assign_manifest':
        result = await bulkAssignManifest(packageIds, data);
        break;
        
      case 'update_service_type':
        result = await bulkUpdateServiceType(packageIds, data);
        break;
        
      case 'delete':
        result = await bulkDeletePackages(packageIds, data);
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid operation' },
          { status: 400 }
        );
    }
    
    console.log(`✅ Bulk operation completed: ${result.modifiedCount} packages affected`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully ${operation}d ${result.modifiedCount} packages`,
      modifiedCount: result.modifiedCount,
      errors: result.errors.length > 0 ? result.errors : null
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Bulk package operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to perform bulk operation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Bulk update package status
async function bulkUpdateStatus(packageIds, data) {
  if (data.status === undefined) {
    throw new Error('Status is required for status update');
  }
  
  const packages = await Package.find({ _id: { $in: packageIds } });
  let modifiedCount = 0;
  const errors = [];
  
  for (const pkg of packages) {
    try {
      pkg.updateStatus(
        data.status,
        data.location || pkg.branch,
        data.notes || 'Bulk status update',
        data.updatedBy || 'Admin'
      );
      await pkg.save();
      modifiedCount++;
    } catch (error) {
      errors.push(`Failed to update ${pkg.trackingNumber}: ${error.message}`);
    }
  }
  
  return { modifiedCount, errors };
}

// Bulk update branch
async function bulkUpdateBranch(packageIds, data) {
  if (!data.branch) {
    throw new Error('Branch is required for branch update');
  }
  
  const result = await Package.updateMany(
    { _id: { $in: packageIds } },
    { 
      branch: data.branch, 
      updatedAt: new Date(),
      $push: {
        statusHistory: {
          status: '$packageStatus',
          timestamp: new Date(),
          location: data.branch,
          notes: 'Branch updated via bulk operation',
          updatedBy: data.updatedBy || 'Admin'
        }
      }
    }
  );
  
  return { modifiedCount: result.modifiedCount, errors: [] };
}

// Bulk mark as claimed
async function bulkMarkClaimed(packageIds, data) {
  const result = await Package.updateMany(
    { _id: { $in: packageIds } },
    { 
      claimed: true, 
      updatedAt: new Date(),
      $push: {
        statusHistory: {
          status: '$packageStatus',
          timestamp: new Date(),
          location: '$branch',
          notes: 'Marked as claimed via bulk operation',
          updatedBy: data.updatedBy || 'Admin'
        }
      }
    }
  );
  
  return { modifiedCount: result.modifiedCount, errors: [] };
}

// Bulk mark as unclaimed
async function bulkMarkUnclaimed(packageIds, data) {
  const result = await Package.updateMany(
    { _id: { $in: packageIds } },
    { 
      claimed: false, 
      updatedAt: new Date(),
      $push: {
        statusHistory: {
          status: '$packageStatus',
          timestamp: new Date(),
          location: '$branch',
          notes: 'Marked as unclaimed via bulk operation',
          updatedBy: data.updatedBy || 'Admin'
        }
      }
    }
  );
  
  return { modifiedCount: result.modifiedCount, errors: [] };
}

// Bulk assign to manifest
async function bulkAssignManifest(packageIds, data) {
  if (!data.manifestID) {
    throw new Error('Manifest ID is required for manifest assignment');
  }
  
  const result = await Package.updateMany(
    { _id: { $in: packageIds } },
    { 
      manifestID: data.manifestID, 
      updatedAt: new Date(),
      $push: {
        statusHistory: {
          status: '$packageStatus',
          timestamp: new Date(),
          location: '$branch',
          notes: `Assigned to manifest ${data.manifestID}`,
          updatedBy: data.updatedBy || 'Admin'
        }
      }
    }
  );
  
  return { modifiedCount: result.modifiedCount, errors: [] };
}

// Bulk update service type
async function bulkUpdateServiceType(packageIds, data) {
  if (!data.serviceTypeID) {
    throw new Error('Service type ID is required for service type update');
  }
  
  const result = await Package.updateMany(
    { _id: { $in: packageIds } },
    { 
      serviceTypeID: data.serviceTypeID, 
      updatedAt: new Date()
    }
  );
  
  return { modifiedCount: result.modifiedCount, errors: [] };
}

// Bulk delete packages
async function bulkDeletePackages(packageIds, data) {
  const packages = await Package.find({ _id: { $in: packageIds } });
  let modifiedCount = 0;
  const errors = [];
  
  for (const pkg of packages) {
    try {
      // Check if package can be deleted (business rules)
      if (pkg.packageStatus === 4 && pkg.claimed) {
        errors.push(`Cannot delete delivered and claimed package: ${pkg.trackingNumber}`);
        continue;
      }
      
      const customerRef = pkg.customerRef;
      
      // Delete package
      await Package.findByIdAndDelete(pkg._id);
      
      // Update customer package statistics
      if (customerRef) {
        try {
          const customer = await Customer.findById(customerRef);
          if (customer) {
            await customer.updatePackageStats();
            await customer.save();
          }
        } catch (customerError) {
          console.error('Error updating customer stats:', customerError);
        }
      }
      
      modifiedCount++;
    } catch (error) {
      errors.push(`Failed to delete ${pkg.trackingNumber}: ${error.message}`);
    }
  }
  
  return { modifiedCount, errors };
}

// GET /api/packages/bulk - Get bulk operation status or history
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    
    // This could return history of bulk operations
    // For now, return available operations
    const availableOperations = [
      { id: 'update_status', name: 'Update Status', description: 'Update package status for multiple packages' },
      { id: 'update_branch', name: 'Update Branch', description: 'Change branch for multiple packages' },
      { id: 'mark_claimed', name: 'Mark Claimed', description: 'Mark packages as claimed' },
      { id: 'mark_unclaimed', name: 'Mark Unclaimed', description: 'Mark packages as unclaimed' },
      { id: 'assign_manifest', name: 'Assign Manifest', description: 'Assign packages to a manifest' },
      { id: 'update_service_type', name: 'Update Service Type', description: 'Change service type for packages' },
      { id: 'delete', name: 'Delete Packages', description: 'Delete multiple packages' }
    ];
    
    return NextResponse.json({
      success: true,
      availableOperations,
      message: 'Use POST method to perform bulk operations'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Bulk operations GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch bulk operations info',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}