const mongoose = require('mongoose');

const blockedIpSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        required: true,
        unique: true
    },
    reason: {
        type: String,
        default: 'Blocked by admin'
    },
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blockedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BlockedIp', blockedIpSchema);
