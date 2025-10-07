const mongoose = require('mongoose');

const clubNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  showToAllPending: {
    type: Boolean,
    default: false
  },
  showToMembers: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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


clubNewsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ClubNews', clubNewsSchema);