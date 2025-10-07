const mongoose = require('mongoose');

const proxyUrlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  detectionMethod: {
    type: String,
    enum: ['automated', 'manual'],
    default: 'automated'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  reason: {
    type: String,
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'false_positive'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  timeoutCount: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  lastFailureReason: {
    type: String,
    default: null
  },
  averageResponseTime: {
    type: Number,
    default: 0
  }
});


proxyUrlSchema.index({ url: 'text' });

module.exports = mongoose.model('ProxyUrl', proxyUrlSchema);