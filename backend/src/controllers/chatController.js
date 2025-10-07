const Chat = require('../models/Chat');
const User = require('../models/User');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const xss = require('xss');

const requestCounts = new Map();
const MAX_REQUESTS = 50;
const TIME_WINDOW = 60 * 1000; 

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userRequests = requestCounts.get(userId) || [];
  
  const recentRequests = userRequests.filter(time => now - time < TIME_WINDOW);
  
  requestCounts.set(userId, recentRequests);
  
  return recentRequests.length < MAX_REQUESTS;
};

const applyRateLimit = (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Không được phép truy cập' });
  }
  
  const userId = req.user._id.toString();
  
  if (!checkRateLimit(userId)) {
    return res.status(429).json({ message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });
  }
  
  const userRequests = requestCounts.get(userId) || [];
  userRequests.push(Date.now());
  requestCounts.set(userId, userRequests);
  
  next();
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input.trim());
};

const onlineUsers = new Map();

exports.getOnlineUsers = () => {
  return onlineUsers;
};

exports.setUserOnlineStatus = (userId, status) => {
  if (status) {
    onlineUsers.set(userId, true);
  } else {
    onlineUsers.delete(userId);
  }
};

exports.getUsersList = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Không được phép truy cập' });
    }

    const currentUserId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
      return res.status(400).json({ message: 'Định dạng ID người dùng không hợp lệ' });
    }
    
    const users = await User.find(
      { _id: { $ne: currentUserId } },
      'fullName email avatar'
    );
    
    const enhancedUsers = await Promise.all(users.map(async user => {
      const chat = await Chat.findOne({
        participants: { $all: [currentUserId, user._id] }
      });

      return {
        ...user.toObject(),
        isOnline: onlineUsers.has(user._id.toString()),
        messageCount: chat ? chat.messageCount : 0
      };
    }));

    enhancedUsers.sort((a, b) => b.messageCount - a.messageCount);

    res.json(enhancedUsers);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Không được phép truy cập' });
    }

    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Định dạng ID người dùng không hợp lệ' });
    }
    
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'fullName email avatar')
      .populate('messages.sender', 'fullName email avatar')
      .sort({ messageCount: -1 });
    
    res.json(chats);
  } catch (error) {
    console.error('Lỗi khi lấy cuộc trò chuyện của người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Định dạng ID cuộc trò chuyện không hợp lệ' });
    }
    
    const chat = await Chat.findById(chatId)
      .populate('messages.sender', 'fullName email avatar')
      .populate('participants', 'fullName email avatar');
    
    if (!chat) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }
    
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Truy cập bị từ chối: Bạn không phải là người tham gia cuộc trò chuyện này' });
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử trò chuyện:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

exports.createOrGetChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: 'Định dạng ID người tham gia không hợp lệ' });
    }
    
    if (participantId === userId.toString()) {
      return res.status(400).json({ message: 'Không thể tạo cuộc trò chuyện với chính mình' });
    }
    
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Không tìm thấy người tham gia' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, participantId],
        messages: []
      });
      await chat.save();
    }

    await chat.populate('participants', 'fullName email avatar');
    res.json(chat);
  } catch (error) {
    console.error('Lỗi khi tạo/lấy cuộc trò chuyện:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

exports.sendMessage = [
  body('content').trim().notEmpty().withMessage('Nội dung tin nhắn không được để trống'),
  body('chatId').custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Định dạng ID cuộc trò chuyện không hợp lệ'),
  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      if (!checkRateLimit(req.user._id.toString())) {
        return res.status(429).json({ message: 'Đã vượt quá giới hạn gửi tin nhắn. Vui lòng thử lại sau.' });
      }
      
      const userRequests = requestCounts.get(req.user._id.toString()) || [];
      userRequests.push(Date.now());
      requestCounts.set(req.user._id.toString(), userRequests);
      
      const { chatId, content } = req.body;
      const userId = req.user._id;
      
      const sanitizedContent = sanitizeInput(content);
      
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
      }
      
      if (!chat.participants.some(id => id.toString() === userId.toString())) {
        return res.status(403).json({ message: 'Bạn không phải là người tham gia cuộc trò chuyện này' });
      }

      chat.messages.push({
        sender: userId,
        content: sanitizedContent
      });
      chat.lastMessage = Date.now();
      chat.messageCount += 1;
      
      await chat.save();
      await chat.populate('messages.sender', 'fullName email avatar');
      
      res.json(chat);
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  }
];

exports.deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Định dạng ID không hợp lệ' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }
    
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Bạn không phải là người tham gia cuộc trò chuyện này' });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Không được phép xóa tin nhắn này' });
    }

    const timeDiff = (Date.now() - message.timestamp.getTime()) / (1000 * 60);
    if (timeDiff > 15) {
      return res.status(400).json({ message: 'Tin nhắn chỉ có thể xóa trong vòng 15 phút sau khi gửi' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'Tin nhắn đã được thu hồi';
    
    await chat.save();
    await chat.populate('messages.sender', 'fullName email avatar');
    
    res.json(chat);
  } catch (error) {
    console.error('Lỗi khi xóa tin nhắn:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};