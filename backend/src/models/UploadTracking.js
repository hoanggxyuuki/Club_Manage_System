const mongoose = require('mongoose');

const uploadTrackingSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  location: {
    country: String,
    region: String,
    city: String
  },
  provider: String,
  uploads: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    fileSize: Number,
    mimeType: String,
    userAgent: String
  }],
  blockedUntil: {
    type: Date,
    default: null
  },
  botScore: {
    type: Number,
    default: 0
  },
  lastReset: {
    type: Date,
    default: Date.now
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  totalUploads: {
    type: Number,
    default: 0
  }
});


uploadTrackingSchema.methods.isBlocked = function() {
  return this.blockedUntil && this.blockedUntil > new Date();
};


uploadTrackingSchema.methods.getRecentUploadCount = function(minutes) {
  const cutoff = new Date(Date.now() - (minutes * 60 * 1000));
  return this.uploads.filter(upload => upload.timestamp > cutoff).length;
};

const UploadTracking = mongoose.model('UploadTracking', uploadTrackingSchema);

module.exports = UploadTracking;