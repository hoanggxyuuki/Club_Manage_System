const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['image', 'document', 'link'],
        required: true
    },
    content: {
        type: String,  
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'event', 'competition', 'project', 'training', 'financial', 'other'],
        default: 'general'
    },
    tags: [String],
    fileType: {
        type: String,
        enum: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            null  
        ]
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'revision_requested'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewComment: String,
    reviewDate: Date,
    relatedEntityType: {
        type: String,
        enum: ['event', 'task', 'competition', 'project', null],
        default: null
    },
    relatedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}, { timestamps: true });


evidenceSchema.virtual('fileCategory').get(function() {
    if (!this.fileType) return 'link';
    if (this.fileType.startsWith('image/')) return 'image';
    if (this.fileType.includes('word')) return 'word';
    if (this.fileType.includes('excel') || this.fileType.includes('spreadsheet')) return 'excel';
    if (this.fileType.includes('powerpoint') || this.fileType.includes('presentation')) return 'powerpoint';
    if (this.fileType === 'application/pdf') return 'pdf';
    return 'document';
});


evidenceSchema.set('toJSON', { virtuals: true });
evidenceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Evidence', evidenceSchema);