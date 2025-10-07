const mongoose = require('mongoose')
const eventSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        enum: ['required', 'optional'],
        required: true,
        default: 'optional'
    },
    managingUnit: {
        name: String,
        description: String
    },
    supervisors: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['supervisor', 'coordinator', 'assistant'],
            default: 'supervisor'
        }
    }],
    participants: [{
        userId: {
            type : mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'declined'],
            default: 'pending'
        },
        attendance: {
            isPresent: {
                type: Boolean,
                default: false
            },
            checkInTime: Date,
            ipAddress: String
        }
    }],
    qrCode: {
        code: {
            type: String,
            unique: true
        },
        raw: {
            type: String,
            unique: true
        },
        value: {
            type: String,
            unique: true
        },
        displayUrl: String,
        expiresAt: Date
    },
    location: {
        type: String
    }
},{
    timestamps: true 
})

module.exports = mongoose.model('Event', eventSchema);