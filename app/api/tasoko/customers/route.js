import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Customer from '../../../../lib/models/Customer';

// GET /api/tasoko/customers - Required endpoint for Tasoko to pull customer listings
export async function GET(request) {
  try {
    await connectDB();
    
    // Extract API token from query parameters
    const { searchParams } = new URL(request.url);
    const apiToken = searchParams.get('id') || searchParams.get('apiToken');
    
    console.log('🔍 Tasoko customers request with token:', apiToken?.substring(0, 10) + '...');
    
    // Validate API token (you should implement proper token validation)
    if (!apiToken) {
      console.warn('⚠️ Missing API token in Tasoko customers request');
      return NextResponse.json(
        { success: false, message: 'API token is required' },
        { status: 401 }
      );
    }
    
    // For demo purposes, we'll accept any token
    // In production, validate against your API token system
    if (apiToken !== process.env.TASOKO_API_TOKEN && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Invalid API token' },
        { status: 401 }
      );
    }
    
    // Fetch all active customers
    const customers = await Customer.find({ 
      isActive: true 
    }).select(
      'userCode firstName lastName branch customerServiceTypeID customerLevelInstructions courierServiceTypeID courierLevelInstructions'
    ).sort({ userCode: 1 });
    
    console.log(`📦 Found ${customers.length} active customers for Tasoko`);
    
    // Format response according to Tasoko API requirements
    const formattedCustomers = customers.map(customer => ({
      UserCode: customer.userCode,
      FirstName: customer.firstName,
      LastName: customer.lastName,
      Branch: customer.branch,
      CustomerServiceTypeID: customer.customerServiceTypeID || "",
      CustomerLevelInstructions: customer.customerLevelInstructions || "",
      CourierServiceTypeID: customer.courierServiceTypeID || "",
      CourierLevelInstructions: customer.courierLevelInstructions || ""
    }));
    
    return NextResponse.json(formattedCustomers, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Tasoko customers endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch customers',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/tasoko/customers - Optional endpoint to sync customers from Tasoko
export async function POST(request) {
  try {
    await connectDB();
    
    const customersData = await request.json();
    
    if (!Array.isArray(customersData)) {
      return NextResponse.json(
        { success: false, message: 'Expected array of customers' },
        { status: 400 }
      );
    }
    
    console.log(`📥 Syncing ${customersData.length} customers from Tasoko`);
    
    let syncedCount = 0;
    let updatedCount = 0;
    let errors = [];
    
    for (const customerData of customersData) {
      try {
        // Validate required fields
        if (!customerData.UserCode || !customerData.FirstName || !customerData.LastName) {
          errors.push(`Invalid customer data: missing required fields`);
          continue;
        }
        
        // Find existing customer or create new one
        const existingCustomer = await Customer.findOne({ 
          userCode: customerData.UserCode 
        });
        
        if (existingCustomer) {
          // Update existing customer
          existingCustomer.firstName = customerData.FirstName;
          existingCustomer.lastName = customerData.LastName;
          existingCustomer.branch = customerData.Branch || existingCustomer.branch;
          existingCustomer.customerServiceTypeID = customerData.CustomerServiceTypeID || "";
          existingCustomer.customerLevelInstructions = customerData.CustomerLevelInstructions || "";
          existingCustomer.courierServiceTypeID = customerData.CourierServiceTypeID || "";
          existingCustomer.courierLevelInstructions = customerData.CourierLevelInstructions || "";
          existingCustomer.updatedBy = 'Tasoko API';
          
          await existingCustomer.save();
          updatedCount++;
          
        } else {
          // Create new customer
          const newCustomer = new Customer({
            userCode: customerData.UserCode,
            firstName: customerData.FirstName,
            lastName: customerData.LastName,
            branch: customerData.Branch || 'Main',
            customerServiceTypeID: customerData.CustomerServiceTypeID || "",
            customerLevelInstructions: customerData.CustomerLevelInstructions || "",
            courierServiceTypeID: customerData.CourierServiceTypeID || "",
            courierLevelInstructions: customerData.CourierLevelInstructions || "",
            createdBy: 'Tasoko API'
          });
          
          await newCustomer.save();
          syncedCount++;
        }
        
      } catch (customerError) {
        console.error('Error processing customer:', customerError);
        errors.push(`Failed to sync customer ${customerData.UserCode}: ${customerError.message}`);
      }
    }
    
    console.log(`✅ Tasoko customer sync completed: ${syncedCount} new, ${updatedCount} updated`);
    
    return NextResponse.json({
      success: true,
      message: `Customer sync completed`,
      results: {
        synced: syncedCount,
        updated: updatedCount,
        total: customersData.length,
        errors: errors.length > 0 ? errors : null
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Tasoko customer sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Customer sync failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}