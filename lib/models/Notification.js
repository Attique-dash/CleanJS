import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Notification Identity
  notificationID: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Notification Type and Category
  type: {
    type: String,
    required: true,
    enum: [
      'package_received',     // Package has been received at warehouse
      'status_update',        // Package status has changed
      'delivery_ready',       // Package is ready for delivery
      'delivery_completed',   // Package has been delivered
      'exception',           // Exception occurred during processing
      'manifest_update',     // Manifest status update
      'pickup_scheduled',    // Pickup has been scheduled
      'delay_notification',  // Delivery delay notification
      'customs_clearance',   // Customs clearance updates
      'payment_required',    // Payment required for delivery
      'damaged_package',     // Package damage reported
      'address_verification' // Address verification needed
    ]
  },
  
  category: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  
  // Recipients
  recipients: {
    customer: {
      userCode: { type: String, index: true },
      firstName: String,
      lastName: String,
      email: String,
      phone: String
    },
    staff: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
      role: String
    }]
  },
  
  // Message Content
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Rich content support
  content: {
    html: String,
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number
    }],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  
  // Related Entities
  relatedEntities: {
    packageID: { type: String, index: true },
    trackingNumber: { type: String, index: true },
    manifestID: { type: String, index: true },
    userCode: { type: String, index: true }
  },
  
  // Delivery Channels
  channels: {
    email: {
      enabled: { type: Boolean, default: true },
      sent: { type: Boolean, default: false },
      sentAt: Date,
      messageId: String,
      error: String,
      retryCount: { type: Number, default: 0 }
    },
    sms: {
      enabled: { type: Boolean, default: false },
      sent: { type: Boolean, default: false },
      sentAt: Date,
      messageId: String,
      error: String,
      retryCount: { type: Number, default: 0 }
    },
    push: {
      enabled: { type: Boolean, default: true },
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String,
      retryCount: { type: Number, default: 0 }
    },
    webhook: {
      enabled: { type: Boolean, default: false },
      url: String,
      sent: { type: Boolean, default: false },
      sentAt: Date,
      response: String,
      statusCode: Number,
      error: String,
      retryCount: { type: Number, default: 0 }
    }
  },
  
  // Scheduling and Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  
  // Processing Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'failed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  // Delivery Status
  deliveryStatus: {
    totalChannels: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    failedDeliveries: { type: Number, default: 0 },
    lastAttempt: Date,
    nextRetry: Date
  },
  
  // User Interaction
  readStatus: [{
    userCode: String,
    readAt: { type: Date, default: Date.now },
    channel: String
  }],
  
  // Template and Localization
  template: {
    name: String,
    version: String,
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  
  locale: {
    type: String,
    default: 'en'
  },
  
  // System Fields
  createdBy: {
    type: String,
    default: 'System'
  },
  
  // Audit Trail
  auditLog: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    performedBy: String,
    details: String
  }]
  
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'recipients.customer.userCode': 1 });
notificationSchema.index({ 'relatedEntities.trackingNumber': 1 });
notificationSchema.index({ 'relatedEntities.packageID': 1 });
notificationSchema.index({ createdAt: -1 });

// Compound indexes
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ type: 1, status: 1 });

// TTL index for automatic cleanup
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for overall delivery success rate
notificationSchema.virtual('deliverySuccessRate').get(function() {
  const total = this.deliveryStatus.totalChannels || 0;
  const successful = this.deliveryStatus.successfulDeliveries || 0;
  return total > 0 ? (successful / total) * 100 : 0;
});

// Virtual to check if notification is read
notificationSchema.virtual('isRead').get(function() {
  return this.readStatus && this.readStatus.length > 0;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function(userCode, channel = 'web') {
  const existing = this.readStatus.find(r => r.userCode === userCode && r.channel === channel);
  if (!existing) {
    this.readStatus.push({
      userCode,
      channel,
      readAt: new Date()
    });
  }
  return this;
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(channel, success, error = null) {
  const channelConfig = this.channels[channel];
  if (!channelConfig) return this;
  
  channelConfig.sent = success;
  channelConfig.sentAt = new Date();
  if (error) channelConfig.error = error;
  
  if (success) {
    this.deliveryStatus.successfulDeliveries++;
  } else {
    this.deliveryStatus.failedDeliveries++;
    channelConfig.retryCount++;
  }
  
  this.deliveryStatus.lastAttempt = new Date();
  
  // Update overall status
  const totalAttempted = this.deliveryStatus.successfulDeliveries + this.deliveryStatus.failedDeliveries;
  const enabledChannels = Object.values(this.channels).filter(c => c.enabled).length;
  
  if (totalAttempted >= enabledChannels) {
    this.status = this.deliveryStatus.successfulDeliveries > 0 ? 'sent' : 'failed';
  }
  
  return this;
};

// Method to schedule retry
notificationSchema.methods.scheduleRetry = function(channel, delayMinutes = 30) {
  const channelConfig = this.channels[channel];
  if (!channelConfig) return this;
  
  this.deliveryStatus.nextRetry = new Date(Date.now() + delayMinutes * 60 * 1000);
  this.status = 'pending';
  
  return this;
};

// Method to add audit log entry
notificationSchema.methods.addAuditEntry = function(action, performedBy, details = '') {
  this.auditLog.push({
    action,
    performedBy,
    details,
    timestamp: new Date()
  });
  return this;
};

// Static method to create package notification
notificationSchema.statics.createPackageNotification = async function(packageData, type, customMessage = null) {
  const notification = new this({
    type,
    title: this.generateTitle(type, packageData),
    message: customMessage || this.generateMessage(type, packageData),
    recipients: {
      customer: {
        userCode: packageData.userCode,
        firstName: packageData.firstName,
        lastName: packageData.lastName,
        email: packageData.email,
        phone: packageData.phone
      }
    },
    relatedEntities: {
      packageID: packageData.packageID,
      trackingNumber: packageData.trackingNumber,
      userCode: packageData.userCode
    },
    priority: this.getPriority(type)
  });
  
  return notification;
};

// Static method to generate notification title
notificationSchema.statics.generateTitle = function(type, data) {
  const titleMap = {
    'package_received': 'Package Received',
    'status_update': 'Package Status Updated',
    'delivery_ready': 'Package Ready for Delivery',
    'delivery_completed': 'Package Delivered',
    'exception': 'Package Exception',
    'manifest_update': 'Manifest Updated',
    'pickup_scheduled': 'Pickup Scheduled',
    'delay_notification': 'Delivery Delayed',
    'customs_clearance': 'Customs Update',
    'payment_required': 'Payment Required',
    'damaged_package': 'Package Damage Report',
    'address_verification': 'Address Verification Required'
  };
  
  return titleMap[type] || 'Notification';
};

// Static method to generate notification message
notificationSchema.statics.generateMessage = function(type, data) {
  const messageMap = {
    'package_received': `Your package ${data.trackingNumber} has been received at our warehouse.`,
    'status_update': `Your package ${data.trackingNumber} status has been updated.`,
    'delivery_ready': `Your package ${data.trackingNumber} is ready for delivery.`,
    'delivery_completed': `Your package ${data.trackingNumber} has been delivered successfully.`,
    'exception': `An exception occurred with your package ${data.trackingNumber}.`,
    'manifest_update': `Manifest ${data.manifestCode} has been updated.`,
    'pickup_scheduled': `Pickup has been scheduled for your package ${data.trackingNumber}.`,
    'delay_notification': `Your package ${data.trackingNumber} delivery has been delayed.`,
    'customs_clearance': `Customs clearance update for package ${data.trackingNumber}.`,
    'payment_required': `Payment is required for package ${data.trackingNumber}.`,
    'damaged_package': `Damage has been reported for package ${data.trackingNumber}.`,
    'address_verification': `Address verification is required for package ${data.trackingNumber}.`
  };
  
  return messageMap[type] || 'You have a new notification.';
};

// Static method to get priority by type
notificationSchema.statics.getPriority = function(type) {
  const priorityMap = {
    'exception': 'urgent',
    'damaged_package': 'high',
    'payment_required': 'high',
    'delivery_completed': 'high',
    'address_verification': 'high',
    'delay_notification': 'normal',
    'status_update': 'normal',
    'delivery_ready': 'normal',
    'package_received': 'low',
    'pickup_scheduled': 'low',
    'manifest_update': 'low',
    'customs_clearance': 'normal'
  };
  
  return priorityMap[type] || 'normal';
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set total channels count
  this.deliveryStatus.totalChannels = Object.values(this.channels)
    .filter(channel => channel.enabled).length;
  
  // Set expiry if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  
  next();
});

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);