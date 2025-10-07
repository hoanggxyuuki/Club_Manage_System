const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, sparse: true },
    microsoftId: { type: String, sparse: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    dateOfBirth: { type: Date },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    bio: { type: String, maxLength: 500 },
    interests: [{ type: String }],
    city: { type: String },
    province: { type: String },
    cv: { type: String, maxLength: 5000 }, 
    relationshipStatus: {
        type: String,
        enum: ['single', 'in-relationship', 'married', 'complicated', 'prefer-not-to-say'],
        default: 'prefer-not-to-say'
    },
    avatar: {
        type: String,
        get: function(v) {
            return v ? `/uploads/avatars/${v}` : null;
        }
    },
    role: {
        type: String,
        enum: ['admin', 'member', 'leader', 'owner', 'demo'],
        default: 'member'
    },
    secondaryRole: {
        type: String,
        default: ''
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'reviewing', 'interview', 'approved', 'rejected'],
        default: 'pending'
    },
    interviewDate: {
        type: Date
    },
    interviewLocation: {
        type: String
    },
    interviewNotes: {
        type: String
    },
    pushSubscription: {
        type: Object,
        select: false 
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true });


userSchema.index({ 
    username: 'text', 
    email: 'text', 
    fullName: 'text' 
});

module.exports = mongoose.model('User', userSchema);