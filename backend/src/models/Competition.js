const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    participants: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        score: {
            type: Number,
            default: 0
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    winners: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        rank: {
            type: Number,
            required: true
        },
        reward: {
            points: {
                type: Number,
                required: true
            },
            achievement: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Achievement'
            }
        }
    }],
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    },
    rules: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


competitionSchema.index({ status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Competition', competitionSchema);