const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
    title: { type: String, required: false },
    description: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    category: {
        type: String,
        required: true,
        enum: ['general', 'qa', 'event', 'project', 'resource', 'technical']
    },
    tags: [String],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isAnnouncement: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    attachments: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true }
    }],
    likes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],
    comments: [{
        content: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isAnonymous: { type: Boolean, default: false },
        replies: [{
            content: String,
            author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            isAnonymous: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }],
        createdAt: { type: Date, default: Date.now }
    }],
    polls: [{
        question: String,
        options: [{
            text: String,
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}] 
        }],
        expiresAt: Date
    }],
    status: {
        type: String,
        enum: ['open', 'closed', 'solved'],
        default: 'open'
    },
    views: [{ 
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

forumSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Forum', forumSchema);