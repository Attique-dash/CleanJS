import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4] // AT WAREHOUSE, DELIVERED TO AIRPORT, IN TRANSIT, AT LOCAL PORT, AT LOCAL SORTING
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: String,
    default: 'System'
  }
});

const packageSchema = new mongoose.Schema({
  packageID: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  courierID: {
    type: String,
    default: ''
  },
  manifestID: {
    type: String,
    default: ''
  },
  collectionID: {
    type: String,
    default: ''
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  controlNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Customer Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  userCode: {
    type: String,
    required: true,
    index: true
  },
  customerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  
  // Package Details
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    cubes: { type: Number, default: 0 }
  },
  pieces: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Shipping Information
  shipper: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  hsCode: {
    type: String,
    default: ''
  },
  
  // Service and Location
  branch: {
    type: String,
    required: true
  },
  serviceTypeID: {
    type: String,
    default: '',
    enum: ['', '59cadcd4-7508-450b-85aa-9ec908d168fe', '25a1d8e5-a478-4cc3-b1fd-a37d0d787302', 
           '8df142ca-0573-4ce9-b11d-7a3e5f8ba196', '7c9638e8-4bb3-499e-8af9-d09f757a099e']
  },
  hazmatCodeID: {
    type: String,
    default: ''
  },
  
  // Status and Processing
  packageStatus: {
    type: Number,
    default: 0,
    enum: [0, 1, 2, 3, 4] // AT WAREHOUSE, DELIVERED TO AIRPORT, IN TRANSIT, AT LOCAL PORT, AT LOCAL SORTING
  },
  claimed: {
    type: Boolean,
    default: false
  },
  unknown: {
    type: Boolean,
    default: false
  },
  aiProcessed: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  entryDate: {
    type: Date,
    required: true
  },
  entryDateTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  entryStaff: {
    type: String,
    default: ''
  },
  
  // Additional Information
  originalHouseNumber: {
    type: String,
    default: ''
  },
  discrepancy: {
    type: Boolean,
    default: false
  },
  discrepancyDescription: {
    type: String,
    default: ''
  },
  coloaded: {
    type: Boolean,
    default: false
  },
  coloadIndicator: {
    type: String,
    default: ''
  },
  packagePayments: {
    type: String,
    default: ''
  },
  
  // API and Control
  apiToken: {
    type: String,
    required: true
  },
  showControls: {
    type: Boolean,
    default: false
  },
  
  // Status History
  statusHistory: [statusHistorySchema],
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['status_update', 'delivery', 'exception', 'pickup']
    },
    message: String,
    sent: { type: Boolean, default: false },
    sentAt: Date,
    createdAt: { type: Date, default: Date.now }
  }]
  
}, {
  timestamps: true
});

// Indexes for better performance
packageSchema.index({ trackingNumber: 1 });
packageSchema.index({ controlNumber: 1 });
packageSchema.index({ userCode: 1 });
packageSchema.index({ packageStatus: 1 });
packageSchema.index({ branch: 1 });
packageSchema.index({ entryDate: 1 });
packageSchema.index({ claimed: 1 });

// Virtual for full customer name
packageSchema.virtual('customerName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for service type name
packageSchema.virtual('serviceTypeName').get(function() {
  const serviceTypes = {
    '59cadcd4-7508-450b-85aa-9ec908d168fe': 'AIR STANDARD',
    '25a1d8e5-a478-4cc3-b1fd-a37d0d787302': 'AIR EXPRESS',
    '8df142ca-0573-4ce9-b11d-7a3e5f8ba196': 'AIR PREMIUM',
    '7c9638e8-4bb3-499e-8af9-d09f757a099e': 'SEA STANDARD',
    '': 'UNSPECIFIED'
  };
  return serviceTypes[this.serviceTypeID] || 'UNKNOWN';
});

// Virtual for status name
packageSchema.virtual('statusName').get(function() {
  const statusNames = {
    0: 'AT WAREHOUSE',
    1: 'DELIVERED TO AIRPORT',
    2: 'IN TRANSIT TO LOCAL PORT',
    3: 'AT LOCAL PORT',
    4: 'AT LOCAL SORTING'
  };
  return statusNames[this.packageStatus] || 'UNKNOWN';
});

// Method to update package status
packageSchema.methods.updateStatus = function(newStatus, location = '', notes = '', updatedBy = 'System') {
  if (this.packageStatus !== newStatus) {
    this.statusHistory.push({
      status: newStatus,
      location,
      notes,
      updatedBy,
      timestamp: new Date()
    });
    this.packageStatus = newStatus;
  }
  return this;
};

// Method to add notification
packageSchema.methods.addNotification = function(type, message) {
  this.notifications.push({
    type,
    message,
    createdAt: new Date()
  });
  return this;
};

// Method to format for Tasoko API response
packageSchema.methods.toTasokoFormat = function() {
  return {
    PackageID: this.packageID,
    CourierID: this.courierID,
    ManifestID: this.manifestID,
    CollectionID: this.collectionID,
    TrackingNumber: this.trackingNumber,
    ControlNumber: this.controlNumber,
    FirstName: this.firstName,
    LastName: this.lastName,
    UserCode: this.userCode,
    Weight: this.weight,
    Shipper: this.shipper,
    EntryStaff: this.entryStaff,
    EntryDate: this.entryDate?.toISOString() || new Date().toISOString(),
    EntryDateTime: this.entryDateTime?.toISOString() || new Date().toISOString(),
    Branch: this.branch,
    Claimed: this.claimed,
    APIToken: this.apiToken,
    ShowControls: this.showControls,
    Description: this.description,
    HSCode: this.hsCode,
    Unknown: this.unknown,
    AIProcessed: this.aiProcessed,
    OriginalHouseNumber: this.originalHouseNumber,
    Cubes: this.dimensions.cubes,
    Length: this.dimensions.length,
    Width: this.dimensions.width,
    Height: this.dimensions.height,
    Pieces: this.pieces,
    Discrepancy: this.discrepancy,
    DiscrepancyDescription: this.discrepancyDescription,
    ServiceTypeID: this.serviceTypeID,
    HazmatCodeID: this.hazmatCodeID,
    Coloaded: this.coloaded,
    ColoadIndicator: this.coloadIndicator,
    PackageStatus: this.packageStatus,
    PackagePayments: this.packagePayments
  };
};

// Static method to generate tracking number
packageSchema.statics.generateTrackingNumber = function(branch = 'MAIN') {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const time = new Date().toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DROPOFF-${date}-${time}-${random}`;
};

// Static method to generate control number
packageSchema.statics.generateControlNumber = function() {
  const prefix = 'EP';
  const number = Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
  return `${prefix}${number}`;
};

// Pre-save middleware
packageSchema.pre('save', function(next) {
  // Generate tracking number if not provided
  if (!this.trackingNumber) {
    this.trackingNumber = this.constructor.generateTrackingNumber(this.branch);
  }
  
  // Generate control number if not provided
  if (!this.controlNumber) {
    this.controlNumber = this.constructor.generateControlNumber();
  }
  
  // Initialize status history if empty
  if (this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.packageStatus,
      timestamp: this.entryDateTime,
      location: this.branch,
      notes: 'Package received at warehouse',
      updatedBy: this.entryStaff || 'System'
    });
  }
  
  next();
});

export default mongoose.models.Package || mongoose.model('Package', packageSchema);