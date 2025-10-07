const mongoose = require('mongoose');

const statisticsSchema = {
    eventCount: {
        type: Number,
        default: 0
    },
    taskCount: {
        type: Number,
        default: 0
    },
    projectCount: {
        type: Number,
        default: 0
    },
    activityCount: {
        type: Number,
        default: 0
    },
    meetingCount: {
        type: Number,
        default: 0
    },
    attendanceRate: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 0
    }
};

const memberPerformanceSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true,
        unique: true
    },
    metrics: {
        eventsParticipated: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        }],
        tasksCompleted: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        }],
        projectsParticipated: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        }],
        activitiesParticipated: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        }],
        meetingsAttended: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ActivitySchedule'
        }]
    },
    statistics: statisticsSchema,
    monthlyStatistics: {
        type: [{
            year: {
                type: Number,
                required: true
            },
            month: {
                type: Number,
                required: true
            },
            metrics: {
                eventsParticipated: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Event'
                }],
                tasksCompleted: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Task'
                }],
                projectsParticipated: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Group'
                }],
                activitiesParticipated: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Group'
                }],
                meetingsAttended: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ActivitySchedule'
                }]
            },
            statistics: statisticsSchema
        }],
        default: []
    },
    rank: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});


memberPerformanceSchema.index({ 'monthlyStatistics.year': 1, 'monthlyStatistics.month': 1 });

module.exports = mongoose.model('MemberPerformance', memberPerformanceSchema);