const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: String,
    type: {
        type: String,
        enum: ['task', 'announcement', 'reminder', 'event', 'group', 'forum', 'evidence', 'bank', 'anonymous', 'profile', 'friend', 'match', 'schedule', 'chat'],
        required: true
    },
    url: {
        type: String
        
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recipients: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        read: {
            type: Boolean,
            default: false
        }
    }],
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);