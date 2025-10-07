const mongoose = require('mongoose');

const blacklistedUrlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});


blacklistedUrlSchema.index({ url: 'text' });

module.exports = mongoose.model('BlacklistedUrl', blacklistedUrlSchema);