const mongoose = require('mongoose');

const anonymousMailSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    files: [{
        filename: String,
        mimetype: String
    }],
    imageUrls: {
        type: [String],
        default: []
    },
    ipAddress: {
        type: String,
        default: '0.0.0.0'
    },
    ipAddressFromApi: {
        type: String,
        default: '0.0.0.0'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AnonymousMail', anonymousMailSchema);