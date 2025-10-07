const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['event', 'competition', 'recognition', 'certificate', 'award']
    },
    category: {
        type: String,
        required: true,
        enum: ['individual', 'team', 'club']
    },
    level: {
        type: String,
        required: true,
        enum: ['local', 'regional', 'national', 'international']
    },
    date: {
        type: Date,
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }],
    evidence: {
        type: String, // URL to evidence file
        required: false
    },
    points: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
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

achievementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Achievement', achievementSchema);