const mongoose = require('mongoose');


const updateStatus = function(schedule) {
  const now = new Date();
  if (schedule.endTime < now) {
    schedule.status = 'completed';
  } else if (schedule.startTime <= now && schedule.endTime >= now) {
    schedule.status = 'ongoing';
  } else {
    schedule.status = 'upcoming';
  }
};

const activityScheduleSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  location: String,
  recurringType: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  maxParticipants: {
    type: Number,
    default: null
  },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined', 'attended', 'absent'],
      default: 'pending'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    checkedInAt: Date,
    notes: String
  }],
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
}, { timestamps: true });


activityScheduleSchema.index({ status: 1, startTime: 1 });


activityScheduleSchema.pre('save', function(next) {
  updateStatus(this);
  next();
});


activityScheduleSchema.pre('find', function() {
  const now = new Date();
  this.where({
    endTime: { $exists: true },
    $or: [
      { status: { $ne: 'cancelled' } },
      { endTime: { $gte: now } }
    ]
  });
});


activityScheduleSchema.methods.canJoin = function() {
  return this.status === 'upcoming' &&
         (!this.maxParticipants ||
          this.attendees.filter(a => ['confirmed', 'attended'].includes(a.status)).length < this.maxParticipants);
};


activityScheduleSchema.methods.getAttendanceStats = function() {
  const stats = {
    total: this.attendees.length,
    confirmed: 0,
    attended: 0,
    absent: 0,
    pending: 0,
    declined: 0
  };

  this.attendees.forEach(attendee => {
    stats[attendee.status]++;
  });

  return stats;
};

module.exports = mongoose.model('ActivitySchedule', activityScheduleSchema);
