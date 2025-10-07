const mongoose = require('mongoose');

const userUrlPreviewSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  hiddenPreviews: [{
    url: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  globalPreviewEnabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('UserUrlPreviewSettings', userUrlPreviewSettingsSchema);