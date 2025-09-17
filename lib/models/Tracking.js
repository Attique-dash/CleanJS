import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  facility: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: String,
  country: {
    type: String,
    required: true,
    default: 'US'
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  }
});

const trackingEventSchema = new mongoose.Schema({
  eventID: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Event Details
  eventType: {
    type: String,
    required: true,
    enum: [
      'PACKAGE_RECEIVED',        // Package received at warehouse
      'LABEL_CREATED',          // Shipping label created
      'PICKED_UP',              // Package picked up by courier
      'IN_TRANSIT',             // Package in transit
      'OUT_FOR_DELIVERY',       // Package out for delivery
      'DELIVERED',              // Package delivered
      'DELIVERY_ATTEMPTED',     // Delivery attempt failed
      'HELD_AT_LOCATION',       // Package held at location
      'CUSTOMS_CLEARED',        // Package cleared customs
      'CUSTOMS_HELD',           // Package held by customs
      'EXCEPTION',              // Exception occurred
      'RETURNED_TO_SENDER',     // Package returned to sender
      'DAMAGED',                // Package damaged
      'LOST',                   // Package lost
      'MANIFEST_CREATED',       // Added to manifest
      'DEPARTED_FACILITY',      // Left facility
      'ARRIVED_FACILITY',       // Arrived at facility
      'SORTED',                 // Package sorted
      'LOADED_FOR_DELIVERY'     // Loaded for delivery
    ]
  },
  
  status: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4], // Maps to package status
    default: 0
  },
  
  statusName: {
    type: String,
    required: true
  },
  
  // Time Information
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  localTimestamp: {
    type: Date
  },
  
  estimatedDelivery: {
    type: Date
  },
  
  // Location Information
  location: locationSchema,
  
  // Event Description
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  shortDescription: {
    type: String,
    maxlength: [100, 'Short description cannot exceed 100 characters']
  },
  
  // Additional Details
  details: {
    courierName: String,
    vehicleId: String,
    driverName: String,
    signature: String,
    recipientName: String,
    deliveryInstructions: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    temperature: Number,
    humidity: Number,
    photoUrl: String,
    proofOfDeliveryUrl: String
  },
  
  // Exception Information
  exceptionDetails: {
    code: String,
    reason: String,
    action: String,
    resolutionRequired: {
      type: Boolean,
      default: false
    },
    estimatedResolution: Date,
    contactInfo: String
  },
  
  // Staff and System Info
  recordedBy: {
    type: String,
    default: 'System'
  },
  
  source: {
    type: String,
    enum: ['system', 'manual', 'api', 'scanner', 'courier_app'],
    default: 'system'
  },
  
  // Visibility and Customer Communication
  isPublic: {
    type: Boolean,
    default: true
  },
  
  customerNotified: {
    type: Boolean,
    default: false
  },
  
  notificationSentAt: Date,
  
  // Verification and Quality Control
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verifiedBy: String,
  verifiedAt: Date
});

const trackingSchema = new mongoose.Schema({
  // Tracking Identity
  trackingID: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Package Reference
  packageID: {
    type: String,
    required: true,
    index: true
  },
  
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  controlNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // Customer Information
  customer: {
    userCode: {
      type: String,
      required: true,
      index: true
    },
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  
  // Current Status Summary
  currentStatus: {
    status: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3, 4],
      default: 0
    },
    statusName: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    location: locationSchema,
    estimatedDelivery: Date,
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    deliveredTo: String
  },
  
  // Service Information
  serviceType: {
    id: String,
    name: String,
    estimatedDays: String
  },
  
  // Origin and Destination
  origin: {
    facility: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  destination: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Package Details
  packageInfo: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      cubes: Number
    },
    pieces: {
      type: Number,
      default: 1
    },
    description: String,
    value: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Shipping Information
  shipper: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    phone: String,
    email: String
  },
  
  // Tracking Events
  events: [trackingEventSchema],
  
  // Delivery Information
  deliveryInfo: {
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    deliveryType: {
      type: String,
      enum: ['home_delivery', 'pickup_point', 'locker', 'office'],
      default: 'home_delivery'
    },
    specialInstructions: String,
    requiresSignature: {
      type: Boolean,
      default: false
    },
    authorizedRecipients: [String],
    deliveryWindows: [{
      date: Date,
      startTime: String,
      endTime: String
    }]
  },
  
  // Exception and Issue Tracking
  exceptions: [{
    code: String,
    type: {
      type: String,
      enum: ['delay', 'damage', 'lost', 'customs', 'address', 'payment', 'weather', 'other']
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'escalated'],
      default: 'open'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolutionNotes: String
  }],
  
  // Performance Metrics
  metrics: {
    totalTransitTime: Number, // in hours
    estimatedTransitTime: Number, // in hours
    onTimeDelivery: Boolean,
    customerSatisfactionScore: {
      type: Number,
      min: 1,
      max: 5
    },
    deliveryAccuracy: Boolean,
    handlingScore: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Communication Log
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'call', 'push', 'webhook']
    },
    recipient: String,
    subject: String,
    message: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed']
    },
    response: String
  }],
  
  // Privacy and Security
  isPubliclyTrackable: {
    type: Boolean,
    default: true
  },
  
  accessRestrictions: [{
    type: {
      type: String,
      enum: ['customer_only', 'authorized_users', 'staff_only']
    },
    reason: String
  }],
  
  // System Fields
  createdBy: {
    type: String,
    default: 'System'
  },
  
  lastModifiedBy: {
    type: String,
    default: 'System'
  }
  
}, {
  timestamps: true
});

// Indexes for performance
trackingSchema.index({ trackingNumber: 1 });
trackingSchema.index({ controlNumber: 1 });
trackingSchema.index({ packageID: 1 });
trackingSchema.index({ 'customer.userCode': 1 });
trackingSchema.index({ 'currentStatus.status': 1 });
trackingSchema.index({ 'currentStatus.lastUpdated': -1 });
trackingSchema.index({ createdAt: -1 });

// Compound indexes
trackingSchema.index({ trackingNumber: 1, 'customer.userCode': 1 });
trackingSchema.index({ 'currentStatus.status': 1, 'currentStatus.lastUpdated': -1 });

// Text index for search
trackingSchema.index({
  trackingNumber: 'text',
  controlNumber: 'text',
  'customer.firstName': 'text',
  'customer.lastName': 'text',
  'shipper.name': 'text'
});

// Virtual for full customer name
trackingSchema.virtual('customerName').get(function() {
  return `${this.customer.firstName} ${this.customer.lastName}`.trim();
});

// Virtual for current status display
trackingSchema.virtual('statusDisplay').get(function() {
  const statusNames = {
    0: 'AT WAREHOUSE',
    1: 'DELIVERED TO AIRPORT',
    2: 'IN TRANSIT TO LOCAL PORT',
    3: 'AT LOCAL PORT',
    4: 'AT LOCAL SORTING'
  };
  return statusNames[this.currentStatus.status] || 'UNKNOWN';
});

// Virtual for delivery progress percentage
trackingSchema.virtual('progressPercentage').get(function() {
  const maxStatus = 4;
  return Math.round((this.currentStatus.status / maxStatus) * 100);
});

// Virtual for active exceptions
trackingSchema.virtual('activeExceptions').get(function() {
  return this.exceptions.filter(ex => ex.status !== 'resolved');
});

// Method to add tracking event
trackingSchema.methods.addEvent = function(eventData) {
  const event = {
    eventType: eventData.eventType,
    status: eventData.status,
    statusName: eventData.statusName || this.getStatusName(eventData.status),
    timestamp: eventData.timestamp || new Date(),
    location: eventData.location,
    description: eventData.description,
    shortDescription: eventData.shortDescription,
    details: eventData.details || {},
    recordedBy: eventData.recordedBy || 'System',
    source: eventData.source || 'system',
    isPublic: eventData.isPublic !== undefined ? eventData.isPublic : true
  };
  
  this.events.push(event);
  
  // Update current status if this is a newer event
  if (event.status >= this.currentStatus.status) {
    this.currentStatus = {
      status: event.status,
      statusName: event.statusName,
      lastUpdated: event.timestamp,
      location: event.location,
      estimatedDelivery: event.estimatedDelivery || this.currentStatus.estimatedDelivery
    };
    
    // Mark as delivered if status is final
    if (event.status === 4) {
      this.currentStatus.isDelivered = true;
      this.currentStatus.deliveredAt = event.timestamp;
      this.currentStatus.deliveredTo = event.details?.recipientName;
    }
  }
  
  return this;
};

// Method to add exception
trackingSchema.methods.addException = function(exceptionData) {
  const exception = {
    code: exceptionData.code,
    type: exceptionData.type,
    description: exceptionData.description,
    severity: exceptionData.severity || 'medium',
    status: 'open',
    reportedAt: new Date()
  };
  
  this.exceptions.push(exception);
  
  // Add corresponding tracking event
  this.addEvent({
    eventType: 'EXCEPTION',
    status: this.currentStatus.status, // Keep current status
    statusName: this.currentStatus.statusName,
    description: `Exception: ${exception.description}`,
    details: { exceptionCode: exception.code }
  });
  
  return this;
};

// Method to resolve exception
trackingSchema.methods.resolveException = function(exceptionId, resolutionNotes) {
  const exception = this.exceptions.id(exceptionId);
  if (exception) {
    exception.status = 'resolved';
    exception.resolvedAt = new Date();
    exception.resolutionNotes = resolutionNotes;
  }
  return this;
};

// Method to add communication log
trackingSchema.methods.logCommunication = function(commData) {
  this.communications.push({
    type: commData.type,
    recipient: commData.recipient,
    subject: commData.subject,
    message: commData.message,
    sentAt: commData.sentAt || new Date(),
    status: commData.status || 'sent'
  });
  return this;
};

// Method to get status name
trackingSchema.methods.getStatusName = function(status) {
  const statusNames = {
    0: 'AT WAREHOUSE',
    1: 'DELIVERED TO AIRPORT',
    2: 'IN TRANSIT TO LOCAL PORT',
    3: 'AT LOCAL PORT',
    4: 'AT LOCAL SORTING'
  };
  return statusNames[status] || 'UNKNOWN';
};

// Method to calculate metrics
trackingSchema.methods.calculateMetrics = function() {
  if (this.events.length < 2) return this;
  
  const firstEvent = this.events[0];
  const lastEvent = this.events[this.events.length - 1];
  
  // Calculate total transit time
  const transitTimeMs = lastEvent.timestamp - firstEvent.timestamp;
  this.metrics.totalTransitTime = Math.round(transitTimeMs / (1000 * 60 * 60)); // hours
  
  // Calculate on-time delivery
  if (this.currentStatus.isDelivered && this.currentStatus.estimatedDelivery) {
    this.metrics.onTimeDelivery = this.currentStatus.deliveredAt <= this.currentStatus.estimatedDelivery;
  }
  
  return this;
};

// Method to get public events (for customer tracking)
trackingSchema.methods.getPublicEvents = function() {
  return this.events.filter(event => event.isPublic).sort((a, b) => b.timestamp - a.timestamp);
};

// Method to format for API response
trackingSchema.methods.toTrackingResponse = function(includePrivate = false) {
  const events = includePrivate ? this.events : this.getPublicEvents();
  
  return {
    trackingNumber: this.trackingNumber,
    controlNumber: this.controlNumber,
    currentStatus: {
      status: this.currentStatus.status,
      statusName: this.currentStatus.statusName,
      lastUpdated: this.currentStatus.lastUpdated,
      location: this.currentStatus.location,
      estimatedDelivery: this.currentStatus.estimatedDelivery,
      isDelivered: this.currentStatus.isDelivered,
      progressPercentage: this.progressPercentage
    },
    customer: {
      name: this.customerName,
      userCode: this.customer.userCode
    },
    serviceType: this.serviceType,
    packageInfo: this.packageInfo,
    events: events.map(event => ({
      eventType: event.eventType,
      status: event.status,
      statusName: event.statusName,
      timestamp: event.timestamp,
      location: event.location,
      description: event.description,
      shortDescription: event.shortDescription
    })),
    exceptions: includePrivate ? this.exceptions : this.activeExceptions,
    deliveryInfo: this.deliveryInfo,
    metrics: this.metrics
  };
};

// Static method to create from package
trackingSchema.statics.createFromPackage = async function(packageData) {
  const tracking = new this({
    packageID: packageData.packageID,
    trackingNumber: packageData.trackingNumber,
    controlNumber: packageData.controlNumber,
    customer: {
      userCode: packageData.userCode,
      firstName: packageData.firstName,
      lastName: packageData.lastName,
      email: packageData.email,
      phone: packageData.phone
    },
    currentStatus: {
      status: packageData.packageStatus || 0,
      statusName: this.prototype.getStatusName(packageData.packageStatus || 0),
      lastUpdated: packageData.entryDateTime || new Date()
    },
    serviceType: {
      id: packageData.serviceTypeID,
      name: packageData.serviceTypeName
    },
    packageInfo: {
      weight: packageData.weight,
      dimensions: packageData.dimensions,
      pieces: packageData.pieces,
      description: packageData.description
    },
    shipper: {
      name: packageData.shipper
    }
  });
  
  // Add initial event
  tracking.addEvent({
    eventType: 'PACKAGE_RECEIVED',
    status: packageData.packageStatus || 0,
    description: 'Package received at warehouse',
    location: {
      facility: packageData.branch,
      city: packageData.branch,
      country: 'US'
    },
    recordedBy: packageData.entryStaff || 'System'
  });
  
  return tracking;
};

export default mongoose.models.Tracking || mongoose.model('Tracking', trackingSchema);