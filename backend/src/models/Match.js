const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'matched', 'rejected'],
        default: 'pending'
    },
    matchScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    user1Accepted: {
        type: Boolean,
        default: false
    },
    user2Accepted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


matchSchema.index({
    user1: 1,
    user2: 1
}, {
    unique: true
});

matchSchema.index({
    user2: 1,
    user1: 1
}, {
    unique: true
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;