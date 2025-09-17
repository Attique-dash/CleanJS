import Customer from '../models/Customer.js';
import Package from '../models/Package.js';
import { DEFAULTS } from '../config/constants.js';

/**
 * Get all customers in Tasoko API format
 * This is required for the Tasoko "Get Customer Endpoint"
 */
export async function getCustomersForTasoko(apiToken) {
  try {
    // Find all active customers
    const customers = await Customer.find({ isActive: true })
      .select('userCode firstName lastName branch customerServiceTypeID customerLevelInstructions courierServiceTypeID courierLevelInstructions')
      .lean();
    
    // Format for Tasoko API response
    const tasokoFormatted = customers.map(customer => ({
      UserCode: customer.userCode,
      FirstName: customer.firstName,
      LastName: customer.lastName,
      Branch: customer.branch,
      CustomerServiceTypeID: customer.customerServiceTypeID || "",
      CustomerLevelInstructions: customer.customerLevelInstructions || "",
      CourierServiceTypeID: customer.courierServiceTypeID || "",
      CourierLevelInstructions: customer.courierLevelInstructions || ""
    }));
    
    return tasokoFormatted;
  } catch (error) {
    console.error('Error fetching customers for Tasoko:', error);
    throw new Error('Failed to fetch customers');
  }
}

/**
 * List customers with pagination and filtering
 */
export async function listCustomers({ 
  page = 1, 
  pageSize = DEFAULTS.PAGE_SIZE, 
  query = {},
  search = '',
  branch = '',
  isActive = null 
} = {}) {
  try {
    const skip = (page - 1) * pageSize;
    
    // Build query
    const mongoQuery = { ...query };
    
    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      mongoQuery.$or = [
        { userCode: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Filter by branch
    if (branch) {
      mongoQuery.branch = branch;
    }
    
    // Filter by active status
    if (isActive !== null) {
      mongoQuery.isActive = isActive;
    }
    
    const [items, total] = await Promise.all([
      Customer.find(mongoQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Customer.countDocuments(mongoQuery)
    ]);
    
    return { 
      items, 
      total, 
      page, 
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('Error listing customers:', error);
    throw new Error('Failed to list customers');
  }
}

/**
 * Get customer by user code
 */
export async function getCustomerByUserCode(userCode) {
  try {
    const customer = await Customer.findOne({ userCode: userCode.toUpperCase() })
      .lean();
    
    return customer;
  } catch (error) {
    console.error(`Error fetching customer ${userCode}:`, error);
    throw new Error('Failed to fetch customer');
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId) {
  try {
    const customer = await Customer.findById(customerId).lean();
    return customer;
  } catch (error) {
    console.error(`Error fetching customer ${customerId}:`, error);
    throw new Error('Failed to fetch customer');
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData) {
  try {
    // Ensure userCode is uppercase
    if (customerData.userCode) {
      customerData.userCode = customerData.userCode.toUpperCase();
    }
    
    // Check if customer already exists
    if (customerData.userCode) {
      const existing = await Customer.findOne({ userCode: customerData.userCode });
      if (existing) {
        throw new Error(`Customer with UserCode ${customerData.userCode} already exists`);
      }
    }
    
    // Check for duplicate email
    if (customerData.email) {
      const existingEmail = await Customer.findOne({ email: customerData.email });
      if (existingEmail) {
        throw new Error(`Customer with email ${customerData.email} already exists`);
      }
    }
    
    const customer = new Customer(customerData);
    await customer.save();
    
    return customer.toObject();
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

/**
 * Update customer information
 */
export async function updateCustomer(userCode, updateData) {
  try {
    // Remove sensitive fields that shouldn't be updated directly
    const { _id, createdAt, packageStats, ...safeUpdateData } = updateData;
    
    // Ensure userCode consistency
    if (safeUpdateData.userCode) {
      safeUpdateData.userCode = safeUpdateData.userCode.toUpperCase();
    }
    
    const customer = await Customer.findOneAndUpdate(
      { userCode: userCode.toUpperCase() },
      { 
        $set: {
          ...safeUpdateData,
          updatedBy: 'API',
          lastActivity: new Date()
        }
      },
      { 
        new: true,
        runValidators: true 
      }
    );
    
    if (!customer) {
      throw new Error(`Customer with UserCode ${userCode} not found`);
    }
    
    return customer.toObject();
  } catch (error) {
    console.error(`Error updating customer ${userCode}:`, error);
    throw error;
  }
}

/**
 * Delete customer (soft delete by marking inactive)
 */
export async function deleteCustomer(userCode) {
  try {
    const customer = await Customer.findOneAndUpdate(
      { userCode: userCode.toUpperCase() },
      { 
        $set: {
          isActive: false,
          updatedBy: 'API',
          lastActivity: new Date()
        }
      },
      { new: true }
    );
    
    if (!customer) {
      throw new Error(`Customer with UserCode ${userCode} not found`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting customer ${userCode}:`, error);
    throw error;
  }
}

/**
 * Find or create customer (used when processing packages)
 */
export async function findOrCreateCustomer(customerData) {
  try {
    const userCode = customerData.userCode?.toUpperCase();
    
    if (!userCode) {
      throw new Error('UserCode is required');
    }
    
    // Try to find existing customer
    let customer = await Customer.findOne({ userCode });
    
    if (!customer) {
      // Create new customer
      const newCustomerData = {
        userCode,
        firstName: customerData.firstName || 'Unknown',
        lastName: customerData.lastName || 'Customer',
        branch: customerData.branch || 'Main',
        email: customerData.email,
        phone: customerData.phone,
        customerServiceTypeID: customerData.customerServiceTypeID || '',
        customerLevelInstructions: customerData.customerLevelInstructions || '',
        courierServiceTypeID: customerData.courierServiceTypeID || '',
        courierLevelInstructions: customerData.courierLevelInstructions || '',
        createdBy: 'System'
      };
      
      customer = new Customer(newCustomerData);
      await customer.save();
      
      console.log(`Created new customer: ${userCode}`);
    } else {
      // Update last activity
      customer.lastActivity = new Date();
      await customer.save();
    }
    
    return customer.toObject();
  } catch (error) {
    console.error('Error finding or creating customer:', error);
    throw error;
  }
}

/**
 * Update customer package statistics
 */
export async function updateCustomerPackageStats(userCode) {
  try {
    const customer = await Customer.findOne({ userCode: userCode.toUpperCase() });
    
    if (!customer) {
      throw new Error(`Customer ${userCode} not found`);
    }
    
    await customer.updatePackageStats();
    await customer.save();
    
    return customer.packageStats;
  } catch (error) {
    console.error(`Error updating package stats for customer ${userCode}:`, error);
    throw error;
  }
}

/**
 * Get customer's packages
 */
export async function getCustomerPackages(userCode, options = {}) {
  try {
    const {
      page = 1,
      pageSize = DEFAULTS.PAGE_SIZE,
      status = null,
      sortBy = 'entryDateTime',
      sortOrder = 'desc'
    } = options;
    
    const skip = (page - 1) * pageSize;
    const query = { userCode: userCode.toUpperCase() };
    
    if (status !== null) {
      query.packageStatus = status;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [packages, total] = await Promise.all([
      Package.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Package.countDocuments(query)
    ]);
    
    return {
      packages,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error(`Error fetching packages for customer ${userCode}:`, error);
    throw error;
  }
}

/**
 * Get customers by branch
 */
export async function getCustomersByBranch(branch) {
  try {
    const customers = await Customer.find({ 
      branch, 
      isActive: true 
    })
    .select('userCode firstName lastName email phone packageStats')
    .sort({ lastName: 1, firstName: 1 })
    .lean();
    
    return customers;
  } catch (error) {
    console.error(`Error fetching customers for branch ${branch}:`, error);
    throw error;
  }
}

/**
 * Search customers
 */
export async function searchCustomers(searchTerm, options = {}) {
  try {
    const {
      limit = 10,
      branch = null,
      isActive = true
    } = options;
    
    const query = {
      isActive,
      $or: [
        { userCode: new RegExp(searchTerm, 'i') },
        { firstName: new RegExp(searchTerm, 'i') },
        { lastName: new RegExp(searchTerm, 'i') },
        { email: new RegExp(searchTerm, 'i') },
        { phone: new RegExp(searchTerm, 'i') }
      ]
    };
    
    if (branch) {
      query.branch = branch;
    }
    
    const customers = await Customer.find(query)
      .select('userCode firstName lastName email phone branch')
      .limit(limit)
      .sort({ userCode: 1 })
      .lean();
    
    return customers;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats() {
  try {
    const stats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } 
          },
          inactiveCustomers: { 
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } 
          },
          customersByBranch: {
            $push: '$branch'
          }
        }
      }
    ]);
    
    // Count customers by branch
    const branchStats = await Customer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$branch',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const result = stats[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      inactiveCustomers: 0
    };
    
    result.branchStats = branchStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    return result;
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    throw error;
  }
}

/**
 * Add tag to customer
 */
export async function addCustomerTag(userCode, tag) {
  try {
    const customer = await Customer.findOne({ userCode: userCode.toUpperCase() });
    
    if (!customer) {
      throw new Error(`Customer ${userCode} not found`);
    }
    
    customer.addTag(tag);
    await customer.save();
    
    return customer.tags;
  } catch (error) {
    console.error(`Error adding tag to customer ${userCode}:`, error);
    throw error;
  }
}

/**
 * Remove tag from customer
 */
export async function removeCustomerTag(userCode, tag) {
  try {
    const customer = await Customer.findOne({ userCode: userCode.toUpperCase() });
    
    if (!customer) {
      throw new Error(`Customer ${userCode} not found`);
    }
    
    customer