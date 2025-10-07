const mongoose = require('mongoose');

const demoNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'update', 'info', 'success', 'warning', 'error'],
    default: 'info'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  showToAllPending: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


demoNotificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DemoNotification', demoNotificationSchema);