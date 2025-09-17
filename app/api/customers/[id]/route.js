import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Customer from '../../../../lib/models/Customer';
import Package from '../../../../lib/models/Package';

// GET /api/customers/[id] - Get customer details
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`👤 Fetching customer details: ${id}`);
    
    // Find customer by ID or userCode
    const customer = await Customer.findOne({
      $or: [
        { _id: id },
        { userCode: id }
      ]
    }).select('-password').lean();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Get package statistics
    const packages = await Package.find({ customerRef: customer._id });
    
    const packageStats = {
      totalPackages: packages.length,
      pendingPackages: packages.filter(pkg => pkg.packageStatus < 4).length,
      deliveredPackages: packages.filter(pkg => pkg.packageStatus === 4).length,
      totalWeight: packages.reduce((sum, pkg) => sum + (pkg.weight || 0), 0)
    };
    
    const customerWithStats = {
      ...customer,
      packageStats,
      lastActivity: customer.updatedAt || customer.createdAt
    };
    
    console.log(`✅ Customer details retrieved: ${customer.userCode}`);
    
    return NextResponse.json({
      success: true,
      data: customerWithStats
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Customer details fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch customer details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const updateData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Updating customer: ${id}`, updateData);
    
    // Find customer
    const customer = await Customer.findOne({
      $or: [
        { _id: id },
        { userCode: id }
      ]
    });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check if userCode or email is being changed and already exists
    if (updateData.userCode && updateData.userCode !== customer.userCode) {
      const existingByUserCode = await Customer.findOne({ 
        userCode: updateData.userCode,
        _id: { $ne: customer._id }
      });
      if (existingByUserCode) {
        return NextResponse.json(
          { success: false, message: 'User code already exists' },
          { status: 400 }
        );
      }
    }
    
    if (updateData.email && updateData.email !== customer.email) {
      const existingByEmail = await Customer.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: customer._id }
      });
      if (existingByEmail) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update customer fields
    if (updateData.userCode) customer.userCode = updateData.userCode.trim().toUpperCase();
    if (updateData.firstName) customer.firstName = updateData.firstName.trim();
    if (updateData.lastName) customer.lastName = updateData.lastName.trim();
    if (updateData.email) customer.email = updateData.email.toLowerCase().trim();
    if (updateData.phone !== undefined) customer.phone = updateData.phone?.trim() || '';
    if (updateData.address !== undefined) customer.address = updateData.address?.trim() || '';
    if (updateData.branch) customer.branch = updateData.branch.trim();
    if (updateData.customerServiceTypeID !== undefined) customer.customerServiceTypeID = updateData.customerServiceTypeID;
    if (updateData.customerLevelInstructions !== undefined) customer.customerLevelInstructions = updateData.customerLevelInstructions;
    if (updateData.courierServiceTypeID !== undefined) customer.courierServiceTypeID = updateData.courierServiceTypeID;
    if (updateData.courierLevelInstructions !== undefined) customer.courierLevelInstructions = updateData.courierLevelInstructions;
    if (updateData.isActive !== undefined) customer.isActive = updateData.isActive;
    
    customer.updatedAt = new Date();
    customer.updatedBy = 'Admin';
    
    await customer.save();
    
    console.log(`✅ Customer updated: ${customer.userCode}`);
    
    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Customer update error:', error);
    
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
        message: 'Failed to update customer',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Deleting customer: ${id}`);
    
    // Find customer
    const customer = await Customer.findOne({
      $or: [
        { _id: id },
        { userCode: id }
      ]
    });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check if customer has packages
    const packageCount = await Package.countDocuments({ customerRef: customer._id });
    
    if (packageCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete customer with existing packages. Customer has ${packageCount} packages.`
        },
        { status: 400 }
      );
    }
    
    // Delete customer
    await Customer.findByIdAndDelete(customer._id);
    
    console.log(`✅ Customer deleted: ${customer.userCode}`);
    
    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Customer deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete customer',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}