import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/config/database';
import Customer from '../../../lib/models/Customer';
import Package from '../../../lib/models/Package';

// GET /api/customers - Get all customers
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const skipParam = searchParams.get('skip');
    const limit = Number.parseInt(limitParam ?? '') || 50;
    const skip = Number.parseInt(skipParam ?? '') || 0;
    
    console.log('📋 Fetching customers with filters:', { branch, status, search, limit, skip });
    
    // Build query
    const query: Record<string, any> = {};
    
    if (branch) {
      query.branch = branch;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    if (search) {
      query.$or = [
        { userCode: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch customers with package statistics
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-password')
      .lean();
    
    // Calculate package statistics for each customer
    const customersWithStats = await Promise.all(customers.map(async (customer) => {
      const packages = await Package.find({ customerRef: customer._id });
      
      const packageStats = {
        totalPackages: packages.length,
        pendingPackages: packages.filter(pkg => pkg.packageStatus < 4).length,
        deliveredPackages: packages.filter(pkg => pkg.packageStatus === 4).length,
        totalWeight: packages.reduce((sum, pkg) => sum + (pkg.weight || 0), 0)
      };
      
      return {
        ...customer,
        packageStats,
        lastActivity: customer.updatedAt || customer.createdAt
      };
    }));
    
    console.log(`✅ Found ${customersWithStats.length} customers`);
    
    return NextResponse.json({
      success: true,
      data: customersWithStats,
      pagination: {
        total: customersWithStats.length,
        limit,
        skip,
        hasMore: customersWithStats.length === limit
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Customers fetch error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch customers',
        error: process.env.NODE_ENV === 'development' ? message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const customerData = await request.json();
    console.log('👤 Creating new customer:', customerData);
    
    // Validate required fields
    const requiredFields = ['userCode', 'firstName', 'lastName', 'email', 'branch'];
    const missingFields = requiredFields.filter(field => !customerData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check if customer with userCode or email already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { userCode: customerData.userCode },
        { email: customerData.email.toLowerCase() }
      ]
    });
    
    if (existingCustomer) {
      const field = existingCustomer.userCode === customerData.userCode ? 'user code' : 'email';
      return NextResponse.json(
        { success: false, message: `Customer with this ${field} already exists` },
        { status: 400 }
      );
    }
    
    // Create new customer
    const newCustomer = new Customer({
      userCode: customerData.userCode.trim().toUpperCase(),
      firstName: customerData.firstName.trim(),
      lastName: customerData.lastName.trim(),
      email: customerData.email.toLowerCase().trim(),
      phone: customerData.phone?.trim() || '',
      address: customerData.address?.trim() || '',
      branch: customerData.branch.trim(),
      customerServiceTypeID: customerData.customerServiceTypeID || '',
      customerLevelInstructions: customerData.customerLevelInstructions || '',
      courierServiceTypeID: customerData.courierServiceTypeID || '',
      courierLevelInstructions: customerData.courierLevelInstructions || '',
      isActive: customerData.isActive !== undefined ? customerData.isActive : true,
      createdBy: 'Admin'
    });
    
    await newCustomer.save();
    
    console.log(`✅ Customer created: ${newCustomer.userCode}`);
    
    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Customer creation error:', error);
    const err: any = error;
    
    if (err && typeof err === 'object' && err.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Customer with this information already exists' },
        { status: 400 }
      );
    }
    
    if (err && typeof err === 'object' && err.name === 'ValidationError') {
      const firstError = err.errors ? Object.values(err.errors)[0] as any : null;
      const message = firstError?.message || 'Validation error';
      return NextResponse.json(
        { success: false, message },
        { status: 400 }
      );
    }
    
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create customer',
        error: process.env.NODE_ENV === 'development' ? message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/customers - Update multiple customers (bulk operations)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const { action, customerIds, updateData } = await request.json();
    
    if (!action || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Action and customer IDs are required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Bulk ${action} operation for ${customerIds.length} customers`);
    
    let result;
    
    switch (action) {
      case 'activate':
        result = await Customer.updateMany(
          { _id: { $in: customerIds } },
          { isActive: true, updatedAt: new Date() }
        );
        break;
        
      case 'deactivate':
        result = await Customer.updateMany(
          { _id: { $in: customerIds } },
          { isActive: false, updatedAt: new Date() }
        );
        break;
        
      case 'update_branch':
        if (!updateData.branch) {
          return NextResponse.json(
            { success: false, message: 'Branch is required for update operation' },
            { status: 400 }
          );
        }
        result = await Customer.updateMany(
          { _id: { $in: customerIds } },
          { branch: updateData.branch, updatedAt: new Date() }
        );
        break;
        
      case 'update_service_type':
        if (!updateData.serviceTypeID) {
          return NextResponse.json(
            { success: false, message: 'Service type ID is required for update operation' },
            { status: 400 }
          );
        }
        result = await Customer.updateMany(
          { _id: { $in: customerIds } },
          { 
            customerServiceTypeID: updateData.serviceTypeID,
            updatedAt: new Date()
          }
        );
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
    
    console.log(`✅ Bulk operation completed: ${result.modifiedCount} customers updated`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.modifiedCount} customers`,
      modifiedCount: result.modifiedCount
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Bulk customer operation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to perform bulk operation',
        error: process.env.NODE_ENV === 'development' ? message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/customers - Delete multiple customers
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { customerIds } = await request.json();
    
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer IDs are required' },
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Deleting ${customerIds.length} customers`);
    
    // Check if any customers have associated packages
    const customersWithPackages = await Package.find({
      customerRef: { $in: customerIds }
    }).distinct('customerRef');
    
    if (customersWithPackages.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete customers with existing packages. ${customersWithPackages.length} customers have packages.`
        },
        { status: 400 }
      );
    }
    
    // Delete customers
    const result = await Customer.deleteMany({
      _id: { $in: customerIds }
    });
    
    console.log(`✅ Deleted ${result.deletedCount} customers`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} customers`,
      deletedCount: result.deletedCount
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Customer deletion error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete customers',
        error: process.env.NODE_ENV === 'development' ? message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}