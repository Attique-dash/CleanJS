// lib/models/Manifest.js
import mongoose from 'mongoose';

const manifestSchema = new mongoose.Schema({
  manifestID: {
    type: String,
    required: true,
    unique: true
  },
  courierID: {
    type: String,
    required: true
  },
  serviceTypeID: {
    type: String,
    required: true,
    enum: ['59cadcd4-7508-450b-85aa-9ec908d168fe', '25a1d8e5-a478-4cc3-b1fd-a37d0d787302', 
           '8df142ca-0573-4ce9-b11d-7a3e5f8ba196', '7c9638e8-4bb3-499e-8af9-d09f757a099e']
  },
  manifestStatus: {
    type: String,
    default: "0",
    enum: ["0", "1", "2", "3", "4"] // Same as package status
  },
  manifestCode: {
    type: String,
    required: true,
    unique: true
  },
  flightDate: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  itemCount: {
    type: Number,
    required: true,
    min: 0
  },
  manifestNumber: {
    type: Number,
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  entryDate: {
    type: Date,
    required: true
  },
  entryDateTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  awbNumber: {
    type: String,
    required: true
  },
  
  // Associated packages and collections
  packages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package'
  }],
  
  // Additional tracking info
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    location: String,
    notes: String,
    updatedBy: { type: String, default: 'System' }
  }],
  
  // API tracking
  apiToken: {
    type: String,
    required: true
  }
  
}, {
  timestamps: true
});

// Indexes
manifestSchema.index({ manifestID: 1 });
manifestSchema.index({ manifestCode: 1 });
manifestSchema.index({ courierID: 1 });
manifestSchema.index({ manifestStatus: 1 });
manifestSchema.index({ flightDate: 1 });

// Virtual for service type name
manifestSchema.virtual('serviceTypeName').get(function() {
  const serviceTypes = {
    '59cadcd4-7508-450b-85aa-9ec908d168fe': 'AIR STANDARD',
    '25a1d8e5-a478-4cc3-b1fd-a37d0d787302': 'AIR EXPRESS',
    '8df142ca-0573-4ce9-b11d-7a3e5f8ba196': 'AIR PREMIUM',
    '7c9638e8-4bb3-499e-8af9-d09f757a099e': 'SEA STANDARD'
  };
  return serviceTypes[this.serviceTypeID] || 'UNKNOWN';
});

// Virtual for status name
manifestSchema.virtual('statusName').get(function() {
  const statusNames = {
    "0": 'AT WAREHOUSE',
    "1": 'DELIVERED TO AIRPORT',
    "2": 'IN TRANSIT TO LOCAL PORT',
    "3": 'AT LOCAL PORT',
    "4": 'AT LOCAL SORTING'
  };
  return statusNames[this.manifestStatus] || 'UNKNOWN';
});

// Method to update status
manifestSchema.methods.updateStatus = function(newStatus, location = '', notes = '', updatedBy = 'System') {
  if (this.manifestStatus !== newStatus) {
    this.statusHistory.push({
      status: newStatus,
      location,
      notes,
      updatedBy,
      timestamp: new Date()
    });
    this.manifestStatus = newStatus;
  }
  return this;
};

// Method to format for Tasoko API
manifestSchema.methods.toTasokoFormat = function() {
  return {
    ManifestID: this.manifestID,
    CourierID: this.courierID,
    ServiceTypeID: this.serviceTypeID,
    ManifestStatus: this.manifestStatus,
    ManifestCode: this.manifestCode,
    FlightDate: this.flightDate?.toISOString() || new Date().toISOString(),
    Weight: this.weight,
    ItemCount: this.itemCount,
    ManifestNumber: this.manifestNumber,
    StaffName: this.staffName,
    EntryDate: this.entryDate?.toISOString() || new Date().toISOString(),
    EntryDateTime: this.entryDateTime?.toISOString() || new Date().toISOString(),
    AWBNumber: this.awbNumber
  };
};

export default mongoose.models.Manifest || mongoose.model('Manifest', manifestSchema);

// ---