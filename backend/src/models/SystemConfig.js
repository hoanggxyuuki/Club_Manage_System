const mongoose = require('mongoose');

const systemConfigEntrySchema = new mongoose.Schema({
  settingName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  settingValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['text', 'boolean', 'number', 'json'],
    default: 'text',
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });


systemConfigEntrySchema.statics.getSetting = async function (settingName) {
  try {
    const setting = await this.findOne({ settingName });
    return setting ? setting.settingValue : null;
  } catch (error) {
    console.error(`Error fetching setting ${settingName}:`, error);
    return null;
  }
};


systemConfigEntrySchema.statics.updateSetting = async function (settingName, settingValue, userId, description = '', type = 'text') {
  try {
    const setting = await this.findOneAndUpdate(
      { settingName },
      { settingValue, lastUpdatedBy: userId, description, type, lastUpdatedAt: Date.now() },
      { new: true, upsert: true, runValidators: true }
    );
    return setting;
  } catch (error) {
    console.error(`Error updating setting ${settingName}:`, error);
    throw error;
  }
};


systemConfigEntrySchema.pre('save', function (next) {
  if (this.isModified()) {
    this.lastUpdatedAt = Date.now();
  }
  next();
});

systemConfigEntrySchema.pre('findOneAndUpdate', function (next) {
  this.set({ lastUpdatedAt: Date.now() });
  next();
});

const SystemConfigEntry = mongoose.model('SystemConfigEntry', systemConfigEntrySchema);

module.exports = SystemConfigEntry;