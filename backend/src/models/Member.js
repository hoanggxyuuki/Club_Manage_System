const mongoose = require('mongoose');
const memberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    role: {
        type: String,
        enum: ['member', 'leader', 'owner'],
        default: 'member'
    },
    secondaryRole: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});



module.exports = mongoose.model('Member', memberSchema);