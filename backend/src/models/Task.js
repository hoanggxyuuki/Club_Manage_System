const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'awaiting_confirmation', 'expired'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    dueDate: Date,
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    statusNotified: {
        type: Boolean,
        default: false
    },
    leaderConfirmation: {
        confirmed: {
            type: Boolean,
            default: false
        },
        confirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        confirmedAt: {
            type: Date,
            default: null
        }
    }
}, { timestamps: true });


taskSchema.pre('save', function(next) {
    if (this.progress === 100 && !this.leaderConfirmation.confirmed) {
        this.status = 'awaiting_confirmation';
    } else if (this.progress === 100 && this.leaderConfirmation.confirmed) {
        this.status = 'completed';
        this.sortOrder = 1;
    } else if (this.dueDate && this.dueDate < new Date() && this.status !== 'completed') {
        this.status = 'expired';
        this.sortOrder = 1;
    }
    next();
});

module.exports = mongoose.model('Task', taskSchema);