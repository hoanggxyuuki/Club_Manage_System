const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    createdById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['member', 'leader'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);