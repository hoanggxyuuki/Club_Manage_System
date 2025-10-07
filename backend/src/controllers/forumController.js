const Forum = require('../models/forum');
const mongoose = require('mongoose');

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 10000;
const MAX_COMMENT_LENGTH = 2000;
const MAX_POLL_QUESTION_LENGTH = 500;
const MAX_POLL_OPTION_LENGTH = 200;

const postRateLimits = new Map();
const commentRateLimits = new Map();
const POST_LIMIT_WINDOW = 10 * 60 * 1000;
const POST_LIMIT_COUNT = 3;
const COMMENT_LIMIT_WINDOW = 1 * 60 * 1000;
const COMMENT_LIMIT_COUNT = 5;

const sanitizeHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .trim();
};

const processTags = (tags) => {
    if (!tags) return [];
    
    let processedTags = [];
    try {
        const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
        
        if (!Array.isArray(tagArray)) {
            return [];
        }
        
        processedTags = tagArray
            .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
            .map(tag => sanitizeHtml(tag.trim()))
            .slice(0, 10);
    } catch (e) {
        console.error('Lỗi xử lý thẻ:', e);
        return [];
    }
    
    return processedTags;
};

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const checkRateLimit = (map, key, windowMs, maxCount) => {
    const now = Date.now();
    const userActivity = map.get(key) || { count: 0, timestamp: now };
    
    if (now - userActivity.timestamp > windowMs) {
        userActivity.count = 1;
        userActivity.timestamp = now;
        map.set(key, userActivity);
        return { limited: false };
    }
    
    if (userActivity.count >= maxCount) {
        return { 
            limited: true, 
            remainingTime: Math.ceil((windowMs - (now - userActivity.timestamp)) / 60000) 
        };
    }
    
    userActivity.count += 1;
    map.set(key, userActivity);
    return { limited: false };
};

const getPopulatedPost = async (postId) => {
    if (!isValidObjectId(postId)) {
        throw new Error('Định dạng ID bài đăng không hợp lệ');
    }
    
    const post = await Forum.findById(postId)
        .populate('author', 'username email avatar fullName')
        .populate('likes.user', 'username email avatar fullName')
        .populate('comments.author', 'username email avatar fullName')
        .populate('comments.replies.author', 'username email avatar fullName')
        .populate('polls.options.votes', 'username email avatar fullName');
    
    if (!post) {
        return null;
    }

    if (post.isAnonymous) {
        post.author = {
            username: 'Người dùng ẩn danh',
            email: 'anonymous@iuptit.com',
            avatar: null
        };
    }
    
    return post;
};

exports.createForum = async (req, res) => {
    try {
        const {  description, category } = req.body;
        const isAnonymous = req.body.isAnonymous === 'true' || req.body.isAnonymous === true;
        
        if ( !description) {
            return res.status(400).json({ message: 'Tiêu đề và mô tả là bắt buộc' });
        }
        
        const userId = req.user._id.toString();
        const rateCheck = checkRateLimit(postRateLimits, userId, POST_LIMIT_WINDOW, POST_LIMIT_COUNT);
        if (rateCheck.limited) {
            return res.status(429).json({ 
                message: `Đã vượt quá giới hạn. Vui lòng thử lại sau ${rateCheck.remainingTime} phút.` 
            });
        }

        if (description.length > MAX_DESCRIPTION_LENGTH) {
            return res.status(400).json({ message: `Mô tả vượt quá độ dài tối đa ${MAX_DESCRIPTION_LENGTH} ký tự` });
        }
        
        const sanitizedDesc = sanitizeHtml(description);
        const titleFromDesc = sanitizedDesc.split('\n')[0].slice(0, 100);
        const sanitizedTitle = sanitizeHtml(titleFromDesc);
        const sanitizedCategory = category ? sanitizeHtml(category) : 'general';
        
        const parsedTags = processTags(req.body.tags);

        const attachments = (req.uploadedFiles || []).map(file => {
            return {
                url: file.filename,
                type: file.mimetype.startsWith('video/') ? 'video' : 'image'
            };
        });

        const forum = new Forum({
            description: sanitizedDesc,
            category: sanitizedCategory,
            tags: parsedTags,
            author: req.user._id,
            attachments,
            isAnonymous: isAnonymous
        });
        
        const savedForum = await forum.save();
        const populatedForum = await getPopulatedPost(savedForum._id);

        const User = require('../models/User');
        const allUsers = await User.find({ _id: { $ne: req.user._id } });
        const userIds = allUsers.map(user => user._id);

        const { createNotification } = require('./notificationController');
        
        if (!isAnonymous) {
            await createNotification({
            body: {
                title: 'Bài Đăng Diễn Đàn Mới',
                message: `${req.user.username} đã tạo một bài đăng diễn đàn mới: ${sanitizedTitle}`,
                type: 'forum',
                recipients: userIds
            },
            user: req.user
        });
        } else {
            await createNotification({
                body: {
                    title: 'Bài Đăng Ẩn Danh Mới',
                    message: `Một người dùng ẩn danh đã tạo bài đăng diễn đàn mới: ${sanitizedTitle}`,
                    type: 'forum',
                    recipients: userIds
                },
                user: req.user
            });
        }
        
        res.status(201).json(populatedForum);
    } catch (error) {
        console.error('Lỗi tạo diễn đàn:', error);
        res.status(400).json({ message: 'Không thể tạo bài đăng diễn đàn' });
    }
};

exports.getAllPosts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const totalPosts = await Forum.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        const posts = await Forum.find()
            .populate('author', 'fullName email avatar fullName')
            .populate('likes.user', 'username email avatar fullName')
            .populate('comments.author', 'username email avatar fullName')
            .populate('comments.replies.author', 'username email avatar fullName')
            .populate('polls.options.votes', 'username email avatar fullName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            posts,
            currentPage: page,
            totalPages,
            totalPosts,
            hasMore: page < totalPages
        });
    } catch (error) {
        console.error('Lỗi lấy tất cả bài đăng:', error);
        res.status(500).json({ message: 'Không thể lấy bài đăng' });
    }
};

exports.getPost = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Định dạng ID bài đăng không hợp lệ' });
        }
        
        const post = await getPopulatedPost(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }
        
        res.json(post);
    } catch (error) {
        console.error('Lỗi lấy bài đăng:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Định dạng ID bài đăng không hợp lệ' });
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }
        
        if (post.author.toString() !== req.user._id.toString() && 
            !['admin', 'leader'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Không được phép sửa bài viết này' });
        }
        
        const { title, description, category, tags } = req.body;
        
        if (title && title.length > MAX_TITLE_LENGTH) {
            return res.status(400).json({ 
                message: `Tiêu đề vượt quá độ dài tối đa ${MAX_TITLE_LENGTH} ký tự` 
            });
        }
        
        if (description && description.length > MAX_DESCRIPTION_LENGTH) {
            return res.status(400).json({ 
                message: `Mô tả vượt quá độ dài tối đa ${MAX_DESCRIPTION_LENGTH} ký tự` 
            });
        }
        
        if (title) post.title = sanitizeHtml(title);
        if (description) post.description = sanitizeHtml(description);
        if (category) post.category = sanitizeHtml(category);
        if (tags) post.tags = processTags(tags);
        
        post.updatedAt = Date.now();
        
        await post.save();
        const populatedPost = await getPopulatedPost(post._id);
        res.json(populatedPost);
    } catch (error) {
        console.error('Lỗi cập nhật bài đăng:', error);
        res.status(500).json({ message: 'Không thể cập nhật bài đăng' });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Định dạng ID bài đăng không hợp lệ' });
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }
        
        if (post.author.toString() !== req.user._id.toString() && 
            !['admin', 'leader'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Không được phép xóa bài viết này' });
        }
        
        await Forum.findByIdAndDelete(id);
        
        res.json({ message: 'Bài đăng đã được xóa thành công' });
    } catch (error) {
        console.error('Lỗi xóa bài đăng:', error);
        res.status(500).json({ message: 'Không thể xóa bài đăng' });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Định dạng ID bài đăng không hợp lệ' });
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }

        const likeIndex = post.likes.findIndex(
            like => like.user && like.user.toString() === req.user._id.toString()
        );

        if (likeIndex === -1) {
            post.likes.push({ user: req.user._id });

            if (post.author && post.author.toString() !== req.user._id.toString()) {
                const { createNotification } = require('./notificationController');
                await createNotification({
                    body: {
                        title: 'Lượt Thích Mới Cho Bài Đăng',
                        message: `${req.user.username} đã thích bài đăng của bạn`,
                        type: 'forum',
                        recipients: [post.author]
                    },
                    user: req.user
                });
            }
        } else {
            post.likes.splice(likeIndex, 1);
        }

        await post.save();
        const populatedPost = await getPopulatedPost(post._id);
        res.json(populatedPost);
    } catch (error) {
        console.error('Lỗi chuyển đổi lượt thích:', error);
        res.status(500).json({ message: 'Không thể xử lý lượt thích' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Định dạng ID bài đăng không hợp lệ' });
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }

        const userId = req.user._id.toString();
        const rateCheck = checkRateLimit(commentRateLimits, userId, COMMENT_LIMIT_WINDOW, COMMENT_LIMIT_COUNT);
        if (rateCheck.limited) {
            return res.status(429).json({ 
                message: `Đã vượt quá giới hạn bình luận. Vui lòng thử lại sau ${rateCheck.remainingTime} phút.` 
            });
        }

        const { content, isAnonymous } = req.body;
        
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ message: 'Nội dung bình luận là bắt buộc' });
        }
        
        if (content.length > MAX_COMMENT_LENGTH) {
            return res.status(400).json({ 
                message: `Bình luận vượt quá độ dài tối đa ${MAX_COMMENT_LENGTH} ký tự` 
            });
        }
        
        const sanitizedContent = sanitizeHtml(content);
        const comment = {
            content: sanitizedContent,
            author: req.user._id,
            replies: [],
            isAnonymous: isAnonymous || false,
            createdAt: new Date()
        };

        post.comments.push(comment);
        await post.save();
        
        if (post.author && post.author.toString() !== req.user._id.toString()) {
            const { createNotification } = require('./notificationController');
            await createNotification({
                body: {
                    title: 'Bình Luận Mới Cho Bài Đăng',
                    message: `${req.user.username} đã bình luận về bài đăng của bạn`,
                    type: 'forum',
                    recipients: [post.author]
                },
                user: req.user
            });
        }

        const populatedPost = await getPopulatedPost(post._id);
        res.json(populatedPost);
    } catch (error) {
        console.error('Lỗi thêm bình luận:', error);
        res.status(500).json({ message: 'Không thể thêm bình luận' });
    }
};

exports.addReplyToComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        
        if (!isValidObjectId(id) || !isValidObjectId(commentId)) {
            return res.status(400).json({ message: 'Định dạng ID không hợp lệ' });
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Bình luận không tồn tại' });
        }
        
        const userId = req.user._id.toString();
        const rateCheck = checkRateLimit(commentRateLimits, userId, COMMENT_LIMIT_WINDOW, COMMENT_LIMIT_COUNT);
        if (rateCheck.limited) {
            return res.status(429).json({ 
                message: `Đã vượt quá giới hạn trả lời. Vui lòng thử lại sau ${rateCheck.remainingTime} phút.` 
            });
        }

        if (!comment.replies) {
            comment.replies = [];
        }

        const { content, isAnonymous } = req.body;
        
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ message: 'Nội dung trả lời là bắt buộc' });
        }
        
        if (content.length > MAX_COMMENT_LENGTH) {
            return res.status(400).json({ 
                message: `Trả lời vượt quá độ dài tối đa ${MAX_COMMENT_LENGTH} ký tự` 
            });
        }
        
        const sanitizedContent = sanitizeHtml(content);
        comment.replies.push({
            content: sanitizedContent,
            author: req.user._id,
            isAnonymous: isAnonymous || false,
            createdAt: new Date()
        });

        await post.save();

        const notifyUsers = new Set();
        if (post.author && post.author.toString() !== req.user._id.toString()) {
            notifyUsers.add(post.author.toString());
        }
        if (comment.author && comment.author.toString() !== req.user._id.toString()) {
            notifyUsers.add(comment.author.toString());
        }
        
        if (notifyUsers.size > 0) {
            const { createNotification } = require('./notificationController');
            await createNotification({
                body: {
                    title: 'Trả Lời Mới Cho Bình Luận',
                    message: `${req.user.username} đã trả lời một bình luận trong bài đăng`,
                    type: 'forum',
                    recipients: Array.from(notifyUsers)
                },
                user: req.user
            });
        }

        const populatedPost = await getPopulatedPost(post._id);
        res.json(populatedPost);
    } catch (error) {
        console.error('Lỗi thêm trả lời bình luận:', error);
        res.status(500).json({ message: 'Không thể thêm trả lời' });
    }
};

exports.addPoll = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Định dạng ID bài đăng không hợp lệ' });
        }
        
        const { question, options, expiresAt } = req.body;
        
        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ 
                message: 'Cuộc thăm dò phải có câu hỏi và ít nhất 2 lựa chọn' 
            });
        }
        
        if (question.length > MAX_POLL_QUESTION_LENGTH) {
            return res.status(400).json({ 
                message: `Câu hỏi khảo sát vượt quá độ dài tối đa ${MAX_POLL_QUESTION_LENGTH} ký tự` 
            });
        }
        
        const validOptions = options
            .filter(opt => typeof opt === 'string' && opt.trim().length > 0)
            .map(opt => {
                if (opt.length > MAX_POLL_OPTION_LENGTH) {
                    throw new Error(`Tùy chọn thăm dò vượt quá độ dài tối đa ${MAX_POLL_OPTION_LENGTH} ký tự`);
                }
                return sanitizeHtml(opt.trim());
            })
            .slice(0, 10);
            
        if (validOptions.length < 2) {
            return res.status(400).json({ message: 'Cuộc thăm dò phải có ít nhất 2 lựa chọn hợp lệ' });
        }
        
        let pollExpiry = null;
        if (expiresAt) {
            const expiryDate = new Date(expiresAt);
            if (isNaN(expiryDate.getTime())) {
                return res.status(400).json({ message: 'Định dạng ngày hết hạn không hợp lệ' });
            }
            pollExpiry = expiryDate;
        } else {
            pollExpiry = new Date();
            pollExpiry.setDate(pollExpiry.getDate() + 7);
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
        }
        
        if (post.author.toString() !== req.user._id.toString() && 
            !['admin', 'leader'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Không được xác thực để thêm bình chọn' });
        }

        post.polls.push({
            question: sanitizeHtml(question),
            options: validOptions.map(opt => ({ text: opt, votes: [] })),
            expiresAt: pollExpiry
        });
        
        await post.save();
        const populatedPost = await getPopulatedPost(post._id);
        res.json(populatedPost);
    } catch (error) {
        console.error('Lỗi thêm thăm dò:', error);
        if (error.message && error.message.includes('Tùy chọn thăm dò vượt quá')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Không thể thêm thăm dò' });
    }
};

exports.voteOnPoll = async (req, res) => {
    try {
        const { id, pollId } = req.params;
        const { optionId } = req.body;
        
        if (!isValidObjectId(id) || !isValidObjectId(pollId) || !isValidObjectId(optionId)) {
            return res.status(400).json({ message: 'Định dạng ID không hợp lệ' });
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }
        
        const poll = post.polls.id(pollId);
        if (!poll) {
            return res.status(404).json({ message: 'Cuộc thăm dò ý kiến không tồn tại' });
        }

        const hasVoted = poll.options.some(option => 
            option.votes.some(vote => vote.toString() === req.user._id.toString())
        );
        
        if (hasVoted) {
            return res.status(400).json({ message: 'Bạn đã bình chọn' });
        }

        if (poll.expiresAt && poll.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Cuộc thăm dò ý kiến đã hết hạn' });
        }
        
        const option = poll.options.id(optionId);
        if (!option) {
            return res.status(404).json({ message: 'Lựa chọn không tồn tại' });
        }

        option.votes.push(req.user._id);
        await post.save();

        if (post.author && post.author.toString() !== req.user._id.toString()) {
            const { createNotification } = require('./notificationController');
            await createNotification({
                body: {
                    title: 'Bình Chọn Mới Cho Cuộc Thăm Dò',
                    message: `${req.user.username} đã bình chọn trong cuộc thăm dò của bạn trong bài đăng`,
                    type: 'forum',
                    recipients: [post.author]
                },
                user: req.user
            });
        }

        const populatedPost = await getPopulatedPost(post._id);
        res.json(populatedPost);
    } catch (error) {
        console.error('Lỗi bình chọn:', error);
        res.status(500).json({ message: 'Không thể xử lý bình chọn' });
    }
};

exports.getSearchSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.json({ suggestions: [] });
        }
        
        const sanitizedQuery = sanitizeHtml(query.trim()).substring(0, 100);
        
        if (sanitizedQuery.length < 2) {
            return res.json({ suggestions: [] });
        }
        
        const safeQueryRegex = sanitizedQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

        const posts = await Forum.find({
            $or: [
                { title: { $regex: safeQueryRegex, $options: 'i' } },
                { tags: { $regex: safeQueryRegex, $options: 'i' } }
            ]
        })
        .select('_id title tags')
        .limit(5);

        const tagsResult = await Forum.aggregate([
            { $match: { tags: { $regex: safeQueryRegex, $options: 'i' } } },
            { $unwind: '$tags' },
            { $match: { 'tags': { $regex: safeQueryRegex, $options: 'i' } } },
            { $group: { _id: '$tags' } },
            { $limit: 3 }
        ]);

        const postSuggestions = posts.map(post => ({
            id: post._id,
            title: post.title,
            type: 'post'
        }));

        const tagSuggestions = tagsResult.map(tag => ({
            title: tag._id,
            type: 'tag'
        }));

        res.json({
            suggestions: [...postSuggestions, ...tagSuggestions]
        });
    } catch (error) {
        console.error('Lỗi gợi ý tìm kiếm:', error);
        res.json({ suggestions: [] });
    }
};

exports.searchPosts = async (req, res) => {
    try {
        const { category,query, tags } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * parseInt(limit);
        
        let searchCriteria = {};
        
        if (query && typeof query === 'string' && query !== 'null') {
            const sanitizedQuery = sanitizeHtml(query.trim()).substring(0, 100);
            if (sanitizedQuery.length >= 2) {
                const safeQueryRegex = sanitizedQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                searchCriteria.$or = [
                    { description: { $regex: safeQueryRegex, $options: 'i' } },
                ];
            }
        }
        
        if (category && category !== 'null' && typeof category === 'string') {
            searchCriteria.category = sanitizeHtml(category);
            
        }
      

        const totalPosts = await Forum.countDocuments(searchCriteria);
        
        const totalPages = Math.ceil(totalPosts / parseInt(limit));
        
        if (totalPosts > 1000 && Object.keys(searchCriteria).length === 0) {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            searchCriteria.createdAt = { $gt: threeMonthsAgo };
        }
        
        const posts = await Forum.find(searchCriteria)
            .populate('author', 'username email avatar fullName')
            .populate('likes.user', 'username email avatar fullName')
            .populate('comments.author', 'username email avatar fullName')
            .populate('comments.replies.author', 'username email avatar fullName')
            .populate('polls.options.votes', 'username email avatar fullName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        res.json({
            posts,
            currentPage: parseInt(page),
            totalPages,
            totalPosts,
            hasMore: parseInt(page) < totalPages
        });
    } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        res.status(500).json({ message: 'Tìm kiếm thất bại. Vui lòng thử với truy vấn khác.' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        
        if (!isValidObjectId(id) || !isValidObjectId(commentId)) {
            return res.status(400).json({ message: 'Định dạng ID không hợp lệ' });
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Bình luận không tồn tại' });
        }
        
        const isCommentAuthor = comment.author.toString() === req.user._id.toString();
        const isPostAuthor = post.author.toString() === req.user._id.toString();
        const isAdminOrLeader = ['admin', 'leader'].includes(req.user.role);
        
        if (!isCommentAuthor && !isPostAuthor && !isAdminOrLeader) {
            return res.status(403).json({ message: 'Không có quyền xóa bình luận này' });
        }
        
        post.comments.pull(commentId);
        await post.save();
        
        const populatedPost = await getPopulatedPost(post._id);
        res.json(populatedPost);
    } catch (error) {
        console.error('Lỗi xóa bình luận:', error);
        res.status(500).json({ message: 'Không thể xóa bình luận' });
    }
};

exports.deleteReply = async (req, res) => {
    try {
        const { id, commentId, replyId } = req.params;
        
        if (!isValidObjectId(id) || !isValidObjectId(commentId) || !isValidObjectId(replyId)) {
            return res.status(400).json({ message: 'Định dạng ID không hợp lệ' });
        }
        
        const post = await Forum.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Bài viết không tồn tại' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Bình luận không tồn tại' });
        }
        
        const reply = comment.replies.id(replyId);
        if (!reply) {
            return res.status(404).json({ message: 'Trả lời không tồn tại' });
        }
        
        const isReplyAuthor = reply.author.toString() === req.user._id.toString();
        const isCommentAuthor = comment.author.toString() === req.user._id.toString();
        const isPostAuthor = post.author.toString() === req.user._id.toString();
        const isAdminOrLeader = ['admin', 'leader'].includes(req.user.role);
        
        if (!isReplyAuthor && !isCommentAuthor && !isPostAuthor && !isAdminOrLeader) {
            return res.status(403).json({ message: 'Không có quyền xóa trả lời này' });
        }
        
        comment.replies.pull(replyId);
        await post.save();
        
        const populatedPost = await getPopulatedPost(post._id);
        res.json(populatedPost);
    } catch (error) {
        console.error('Lỗi xóa trả lời:', error);
        res.status(500).json({ message: 'Không thể xóa trả lời' });
    }
};

setInterval(() => {
    const now = Date.now();
    
    postRateLimits.forEach((data, key) => {
        if (now - data.timestamp > 24 * 60 * 60 * 1000) {
            postRateLimits.delete(key);
        }
    });
    
    commentRateLimits.forEach((data, key) => {
        if (now - data.timestamp > 60 * 60 * 1000) {
            commentRateLimits.delete(key);
        }
    });
}, 60 * 60 * 1000);