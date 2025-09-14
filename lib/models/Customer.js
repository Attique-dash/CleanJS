import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  userCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Address Information
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'US' }
  },
  
  // Branch and Service Information
  branch: {
    type: String,
    required: true,
    trim: true
  },
  
  // Service Type Settings
  customerServiceTypeID: {
    type: String,
    default: '',
    enum: ['', '59cadcd4-7508-450b-85aa-9ec908d168fe', '25a1d8e5-a478-4cc3-b1fd-a37d0d787302', 
           '8df142ca-0573-4ce9-b11d-7a3e5f8ba196', '7c9638e8-4bb3-499e-8af9-d09f757a099e']
  },
  customerLevelInstructions: {
    type: String,
    default: '',
    maxlength: [500, 'Instructions cannot exceed 500 characters']
  },
  courierServiceTypeID: {
    type: String,
    default: '',
    enum: ['', '59cadcd4-7508-450b-85aa-9ec908d168fe', '25a1d8e5-a478-4cc3-b1fd-a37d0d787302', 
           '8df142ca-0573-4ce9-b11d-7a3e5f8ba196', '7c9638e8-4bb3-499e-8af9-d09f757a099e']
  },
  courierLevelInstructions: {
    type: String,
    default: '',
    maxlength: [500, 'Instructions cannot exceed 500 characters']
  },
  
  // Status and Activity
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Package Statistics
  packageStats: {
    totalPackages: { type: Number, default: 0 },
    pendingPackages: { type: Number, default: 0 },
    deliveredPackages: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 },
    lastPackageDate: { type: Date, default: null }
  },
  
  // Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    language: { type: String, default: 'en', enum: ['en', 'es', 'fr'] },
    timezone: { type: String, default: 'America/New_York' }
  },
  
  // Notes and Tags
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // System Fields
  createdBy: {
    type: String,
    default: 'System'
  },
  updatedBy: {
    type: String,
    default: 'System'
  }
  
}, {
  timestamps: true
});

// Indexes for better performance
customerSchema.index({ userCode: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ branch: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ 'packageStats.totalPackages': -1 });
customerSchema.index({ lastActivity: -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted address
customerSchema.virtual('formattedAddress').get(function() {
  const addr = this.address;
  if (!addr.street) return '';
  
  const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
  return parts.join(', ');
});

// Virtual for service type names
customerSchema.virtual('customerServiceTypeName').get(function() {
  const serviceTypes = {
    '59cadcd4-7508-450b-85aa-9ec908d168fe': 'AIR STANDARD',
    '25a1d8e5-a478-4cc3-b1fd-a37d0d787302': 'AIR EXPRESS',
    '8df142ca-0573-4ce9-b11d-7a3e5f8ba196': 'AIR PREMIUM',
    '7c9638e8-4bb3-499e-8af9-d09f757a099e': 'SEA STANDARD',
    '': 'UNSPECIFIED'
  };
  return serviceTypes[this.customerServiceTypeID] || 'UNKNOWN';
});

customerSchema.virtual('courierServiceTypeName').get(function() {
  const serviceTypes = {
    '59cadcd4-7508-450b-85aa-9ec908d168fe': 'AIR STANDARD',
    '25a1d8e5-a478-4cc3-b1fd-a37d0d787302': 'AIR EXPRESS',
    '8df142ca-0573-4ce9-b11d-7a3e5f8ba196': 'AIR PREMIUM',
    '7c9638e8-4bb3-499e-8af9-d09f757a099e': 'SEA STANDARD',
    '': 'UNSPECIFIED'
  };
  return serviceTypes[this.courierServiceTypeID] || 'UNKNOWN';
});

// Method to update package statistics
customerSchema.methods.updatePackageStats = async function() {
  const Package = mongoose.model('Package');
  
  const stats = await Package.aggregate([
    { $match: { userCode: this.userCode } },
    {
      $group: {
        _id: null,
        totalPackages: { $sum: 1 },
        pendingPackages: { $sum: { $cond: [{ $lt: ['$packageStatus', 4] }, 1, 0] } },
        deliveredPackages: { $sum: { $cond: [{ $eq: ['$packageStatus', 4] }, 1, 0] } },
        totalWeight: { $sum: '$weight' },
        lastPackageDate: { $max: '$entryDate' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.packageStats = {
      totalPackages: stats[0].totalPackages || 0,
      pendingPackages: stats[0].pendingPackages || 0,
      deliveredPackages: stats[0].deliveredPackages || 0,
      totalWeight: stats[0].totalWeight || 0,
      lastPackageDate: stats[0].lastPackageDate || null
    };
  }
  
  this.lastActivity = new Date();
  return this;
};

// Method to add tag
customerSchema.methods.addTag = function(tag) {
  if (tag && !this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this;
};

// Method to remove tag
customerSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this;
};

// Method to format for Tasoko API response
customerSchema.methods.toTasokoFormat = function() {
  return {
    UserCode: this.userCode,
    FirstName: this.firstName,
    LastName: this.lastName,
    Branch: this.branch,
    CustomerServiceTypeID: this.customerServiceTypeID,
    CustomerLevelInstructions: this.customerLevelInstructions,
    CourierServiceTypeID: this.courierServiceTypeID,
    CourierLevelInstructions: this.courierLevelInstructions
  };
};

// Static method to generate user code
customerSchema.statics.generateUserCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Static method to find or create customer
customerSchema.statics.findOrCreate = async function(customerData) {
  let customer = await this.findOne({ userCode: customerData.userCode });
  
  if (!customer) {
    customer = new this(customerData);
    await customer.save();
  }
  
  return customer;
};

// Pre-save middleware
customerSchema.pre('save', async function(next) {
  // Generate user code if not provided
  if (!this.userCode) {
    let userCode;
    let isUnique = false;
    
    while (!isUnique) {
      userCode = this.constructor.generateUserCode();
      const existing = await this.constructor.findOne({ userCode });
      isUnique = !existing;
    }
    
    this.userCode = userCode;
  }
  
  // Update activity timestamp
  if (this.isModified() && !this.isNew) {
    this.lastActivity = new Date();
  }
  
  next();
});

// Post-save middleware to update package references
customerSchema.post('save', async function(doc) {
  if (doc.isModified('userCode') || doc.isNew) {
    const Package = mongoose.model('Package');
    await Package.updateMany(
      { userCode: doc.userCode },
      { customerRef: doc._id }
    );
  }
});

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);