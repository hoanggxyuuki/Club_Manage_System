const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');


const activeVideoSessions = new Map();

/**
 * Route để tạo phiên gọi video mới
 * @route POST /api/video/create
 * @access Private
 */
router.post('/create', auth, (req, res) => {
  try {
    const userId = req.user._id;
    const { username } = req.user;
    
    
    const roomId = `jitsi-${uuidv4()}`;
    
    
    activeVideoSessions.set(roomId, {
      createdBy: userId,
      createdAt: new Date(),
      participants: [{
        id: userId,
        name: username,
        joinedAt: new Date()
      }]
    });
    
    return res.status(201).json({
      success: true,
      roomId,
      message: 'Phiên gọi video đã được tạo'
    });
  } catch (error) {
    console.error('Error creating video session:', error);
    return res.status(500).json({
      success: false,
      error: 'Không thể tạo phiên gọi video'
    });
  }
});

/**
 * Route để tham gia phiên gọi video hiện có
 * @route POST /api/video/join
 * @access Private
 */
router.post('/join', auth, (req, res) => {
  try {
    const userId = req.user._id;
    const { username } = req.user;
    const { roomId } = req.body;
    
    
    if (!activeVideoSessions.has(roomId)) {
      return res.status(404).json({
        success: false,
        error: 'Phiên gọi video không tồn tại hoặc đã kết thúc'
      });
    }
    
    
    const session = activeVideoSessions.get(roomId);
    
    
    const existingParticipant = session.participants.find(p => p.id === userId);
    if (!existingParticipant) {
      session.participants.push({
        id: userId,
        name: username,
        joinedAt: new Date()
      });
      activeVideoSessions.set(roomId, session);
    }
    
    return res.status(200).json({
      success: true,
      roomId,
      participants: session.participants,
      message: 'Đã tham gia phiên gọi video'
    });
  } catch (error) {
    console.error('Error joining video session:', error);
    return res.status(500).json({
      success: false,
      error: 'Không thể tham gia phiên gọi video'
    });
  }
});

/**
 * Route để kết thúc phiên gọi video
 * @route POST /api/video/end
 * @access Private
 */
router.post('/end', auth, (req, res) => {
  try {
    const { roomId } = req.body;
    
    
    if (!activeVideoSessions.has(roomId)) {
      return res.status(404).json({
        success: false,
        error: 'Phiên gọi video không tồn tại hoặc đã kết thúc'
      });
    }
    
    
    activeVideoSessions.delete(roomId);
    
    return res.status(200).json({
      success: true,
      message: 'Phiên gọi video đã kết thúc'
    });
  } catch (error) {
    console.error('Error ending video session:', error);
    return res.status(500).json({
      success: false,
      error: 'Không thể kết thúc phiên gọi video'
    });
  }
});

/**
 * Route để lấy thông tin về phiên gọi video
 * @route GET /api/video/:roomId
 * @access Private
 */
router.get('/:roomId', auth, (req, res) => {
  try {
    const { roomId } = req.params;
    
    
    if (!activeVideoSessions.has(roomId)) {
      return res.status(404).json({
        success: false,
        error: 'Phiên gọi video không tồn tại hoặc đã kết thúc'
      });
    }
    
    const session = activeVideoSessions.get(roomId);
    
    return res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error getting video session:', error);
    return res.status(500).json({
      success: false,
      error: 'Không thể lấy thông tin phiên gọi video'
    });
  }
});

module.exports = router;