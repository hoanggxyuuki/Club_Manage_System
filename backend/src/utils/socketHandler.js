const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { setUserOnlineStatus, getOnlineUsers } = require('../controllers/chatController');

let io;
const activeVideoRooms = new Map(); 
const videoCallTimeouts = new Map(); 
const MAX_CALL_DURATION = 3600000; 
const CALL_REQUEST_TIMEOUT = 30000; 
const userSocketMap = new Map();
const setupSocket = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Lỗi xác thực'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (!user) {
                return next(new Error('Không tìm thấy người dùng'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Lỗi xác thực'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Người dùng đã kết nối: ${socket.user._id}`);
        
        const userId = socket.user._id.toString();
        userSocketMap.set(userId, socket.id);
        setUserOnlineStatus(userId, true);
        
        socket.join(userId);

        io.emit('user_online', userId);
        
        const onlineUsersMap = getOnlineUsers();
        const onlineUserIds = Array.from(onlineUsersMap.keys());
        socket.emit('online_users', onlineUserIds);

        socket.on('join_chat', async (chatId) => {
            try {
                const roomName = `chat_${chatId}`;
                console.log(`Đang cố gắng tham gia phòng chat: ${roomName}`);
                
                const chat = await Chat.findById(chatId)
                    .populate('participants', 'username email');
                
                if (!chat) {
                    console.log(`Không tìm thấy cuộc trò chuyện: ${chatId}`);
                    return;
                }
                
                if (!chat.participants.some(p => p._id.toString() === socket.user._id.toString())) {
                    console.log(`Người dùng ${socket.user._id} (${socket.user.username}) không được phép tham gia cuộc trò chuyện: ${chatId}`);
                    console.log('Thành viên cuộc trò chuyện:', chat.participants.map(p => `${p._id} (${p.username})`));
                    return;
                }

                await socket.join(roomName);
                
                const sockets = await io.in(roomName).fetchSockets();
                console.log(`Thành viên trong phòng ${roomName} sau khi tham gia:`,
                    sockets.map(s => `${s.user._id} (${s.user.username})`));
            } catch (error) {
                console.error('Lỗi khi tham gia cuộc trò chuyện:', error);
            }
        });

        socket.on('leave_chat', (chatId) => {
            const roomName = `chat_${chatId}`;
            socket.leave(roomName);
            console.log(`Người dùng ${socket.user._id} đã rời phòng chat: ${roomName}`);
        });

        socket.on('send_message', async (data) => {
            try {
                console.log('Đã nhận dữ liệu tin nhắn:', data);
                const { chatId, message } = data;
                
                if (!chatId || !message || !message.content) {
                    throw new Error('Dữ liệu tin nhắn không hợp lệ');
                }
                
                const messageId = new mongoose.Types.ObjectId();
                const timestamp = new Date();
                
                const newMessage = {
                    _id: messageId,
                    sender: socket.user._id,
                    content: message.content,
                    timestamp: timestamp,
                    replyTo: message.replyTo || null
                };

                const chat = await Chat.findByIdAndUpdate(
                    chatId,
                    {
                        $push: { messages: newMessage },
                        $set: { lastMessage: timestamp },
                        $inc: { messageCount: 1 }
                    },
                    { new: true }
                )
                .populate('messages.sender', 'username email')
                .populate('participants', 'username email');

                if (!chat) {
                    throw new Error('Không tìm thấy cuộc trò chuyện');
                }

                const messageData = {
                    chatId,
                    message: {
                        _id: messageId,
                        content: message.content,
                        timestamp: timestamp,
                        replyTo: message.replyTo || null,
                        sender: {
                            _id: socket.user._id,
                            fullName: socket.user.fullName,
                            email: socket.user.email
                        }
                    }
                };

                const roomName = `chat_${chatId}`;
                console.log(`Đang gửi tin nhắn đến phòng: ${roomName}`);
                console.log('Dữ liệu tin nhắn sẽ gửi:', messageData);

                const sockets = await io.in(roomName).fetchSockets();
                console.log(`Số người dùng trong phòng ${roomName}: ${sockets.length}`);
                console.log('Thành viên trong phòng:', sockets.map(s => s.user._id.toString()));

                io.to(roomName).emit('new_message', messageData);
                console.log('Đã gửi tin nhắn đến phòng');

                const { createNotification } = require('../controllers/notificationController');
                const otherParticipants = chat.participants
                    .filter(p => p._id.toString() !== socket.user._id.toString())
                    .map(p => p._id.toString());

                if (otherParticipants.length > 0) {
                    await createNotification({
                        body: {
                            title: 'Tin nhắn mới',
                            message: `${socket.user.username} đã gửi một tin nhắn: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                            type: 'chat',
                            recipients: otherParticipants,
                            url: `/member/chat`,
                            sender: socket.user._id
                        },
                        user: socket.user
                    });
                }

            } catch (error) {
                console.error('Lỗi khi xử lý tin nhắn:', error);
                socket.emit('message_error', { error: 'Có lỗi xảy ra khi gửi tin nhắn' });
            }
        });

        socket.on('message_reaction', async (data) => {
            try {
                const { chatId, messageId, emoji } = data;
                
                if (messageId.startsWith('temp-')) {
                    return;
                }

                const reaction = {
                    userId: socket.user._id,
                    emoji: emoji,
                    createdAt: new Date()
                };

                const chat = await Chat.findOneAndUpdate(
                    {
                        _id: chatId,
                        'messages._id': messageId
                    },
                    {
                        $push: {
                            'messages.$.reactions': reaction
                        }
                    },
                    { new: true }
                ).populate('messages.reactions.userId', 'fullName email');

                if (!chat) {
                    throw new Error('Không tìm thấy cuộc trò chuyện hoặc tin nhắn');
                }

                const message = chat.messages.find(m => m._id.toString() === messageId);
                if (!message) {
                    throw new Error('Không tìm thấy tin nhắn');
                }

                io.to(`chat_${chatId}`).emit('message_reaction_update', {
                    chatId,
                    messageId,
                    reactions: message.reactions
                });
            } catch (error) {
                console.error('Error handling reaction:', error);
                socket.emit('reaction_error', { error: error.message });
            }
        });

        socket.on('remove_reaction', async (data) => {
            try {
                const { chatId, messageId } = data;

                if (messageId.startsWith('temp-')) {
                    return;
                }

                const chat = await Chat.findOneAndUpdate(
                    {
                        _id: chatId,
                        'messages._id': messageId
                    },
                    {
                        $pull: {
                            'messages.$.reactions': {
                                userId: socket.user._id
                            }
                        }
                    },
                    { new: true }
                ).populate('messages.reactions.userId', 'fullName email');

                if (!chat) {
                    throw new Error('Chat or message not found');
                }

                const message = chat.messages.find(m => m._id.toString() === messageId);
                if (!message) {
                    throw new Error('Message not found');
                }

                io.to(`chat_${chatId}`).emit('message_reaction_update', {
                    chatId,
                    messageId,
                    reactions: message.reactions
                });
            } catch (error) {
                console.error('Error removing reaction:', error);
                socket.emit('reaction_error', { error: error.message });
            }
        });

        socket.on('typing_start', (chatId) => {
            socket.broadcast.to(`chat_${chatId}`).emit('user_typing', {
                chatId,
                user: {
                    _id: socket.user._id.toString(),
                    name: socket.user.username
                }
            });
        });

        socket.on('typing_end', (chatId) => {
            socket.broadcast.to(`chat_${chatId}`).emit('user_stop_typing', {
                chatId,
                user: {
                    _id: socket.user._id.toString(),
                    name: socket.user.username
                }
            });
        });

        socket.on('delete_message', async (data) => {
            try {
                const { chatId, messageId } = data;
                
                const chat = await Chat.findById(chatId);
                if (!chat) {
                    throw new Error('Chat not found');
                }

                const message = chat.messages.id(messageId);
                if (!message) {
                    throw new Error('Message not found');
                }

                if (message.sender.toString() !== socket.user._id.toString()) {
                    throw new Error('Not authorized to delete this message');
                }

                const timeDiff = (Date.now() - message.timestamp.getTime()) / (1000 * 60);
                if (timeDiff > 15) {
                    throw new Error('Messages can only be deleted within 15 minutes of sending');
                }

                message.isDeleted = true;
                message.deletedAt = new Date();
                message.content = 'Tin nhắn đã được thu hồi';
                
                await chat.save();

                io.to(`chat_${chatId}`).emit('message_deleted', {
                    chatId,
                    messageId,
                    content: message.content
                });
            } catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('message_error', { error: error.message });
            }
        });

        socket.on('video_call_request', async ({ targetUserId }) => {
            try {
                const callerId = socket.user._id.toString();
                console.log(`Video call request from ${callerId} to ${targetUserId}`);
                
                if (!io.sockets.adapter.rooms.has(targetUserId)) {
                    socket.emit('call_error', {
                        message: 'User is offline',
                        code: 'USER_OFFLINE'
                    });
                    return;
                }

                let isTargetInCall = false;
                let targetActiveRoom = null;
                activeVideoRooms.forEach((participants, roomId) => {
                    if (participants.has(targetUserId)) {
                        isTargetInCall = true;
                        targetActiveRoom = roomId;
                    }
                });

                if (isTargetInCall) {
                    socket.emit('call_error', {
                        message: 'User is already in another call',
                        code: 'USER_BUSY',
                        details: { roomId: targetActiveRoom }
                    });
                    return;
                }

                let isCallerInCall = false;
                activeVideoRooms.forEach((participants) => {
                    if (participants.has(callerId)) {
                        isCallerInCall = true;
                    }
                });

                if (isCallerInCall) {
                    socket.emit('call_error', {
                        message: 'You are already in another call',
                        code: 'CALLER_BUSY'
                    });
                    return;
                }

                const timeoutId = setTimeout(() => {
                    if (videoCallTimeouts.has(callerId)) {
                        videoCallTimeouts.delete(callerId);
                        socket.emit('call_error', { message: 'Call request timed out' });
                    }
                }, CALL_REQUEST_TIMEOUT);

                videoCallTimeouts.set(callerId, timeoutId);
                
                io.to(targetUserId).emit('incoming_call', {
                    callerId,
                    callerName: socket.user.username,
                    callerAvatar: socket.user.avatar
                });
            } catch (error) {
                console.error('Error in video call request:', error);
                socket.emit('call_error', {
                    message: 'Internal server error',
                    code: 'SERVER_ERROR'
                });
            }
        });

        socket.on('video_call_accepted', ({ callerId }) => {
            try {
                const accepterId = socket.user._id.toString();
                
                if (!io.sockets.adapter.rooms.has(callerId)) {
                    socket.emit('call_error', {
                        message: 'Caller is no longer available',
                        code: 'CALLER_UNAVAILABLE'
                    });
                    return;
                }

                const roomId = [callerId, accepterId].sort().join('-');
                
                if (videoCallTimeouts.has(callerId)) {
                    clearTimeout(videoCallTimeouts.get(callerId));
                    videoCallTimeouts.delete(callerId);
                }
                
                let userInCall = false;
                activeVideoRooms.forEach((participants) => {
                    if (participants.has(callerId) || participants.has(accepterId)) {
                        userInCall = true;
                    }
                });

                if (userInCall) {
                    socket.emit('call_error', {
                        message: 'One of the participants is already in a call',
                        code: 'USER_BUSY'
                    });
                    return;
                }

                if (!activeVideoRooms.has(roomId)) {
                    activeVideoRooms.set(roomId, new Set([callerId, accepterId]));
                    
                    setTimeout(() => {
                        if (activeVideoRooms.has(roomId)) {
                            const participants = activeVideoRooms.get(roomId);
                            participants.forEach(participantId => {
                                io.to(participantId).emit('call_ended', {
                                    reason: 'Call duration limit reached',
                                    code: 'DURATION_LIMIT'
                                });
                            });
                            activeVideoRooms.delete(roomId);
                        }
                    }, MAX_CALL_DURATION);
                }
                
                const callInfo = {
                    roomId,
                    startTime: Date.now(),
                    participants: [
                        { id: callerId, name: socket.user.username },
                        { id: accepterId, name: socket.user.username }
                    ]
                };
                
                io.to(callerId).emit('call_connected', callInfo);
                io.to(accepterId).emit('call_connected', callInfo);

            } catch (error) {
                console.error('Error in video call accept:', error);
                socket.emit('call_error', {
                    message: 'Failed to establish call',
                    code: 'CONNECTION_ERROR'
                });
            }
        });

        socket.on('video_call_rejected', ({ callerId, reason }) => {
            try {
                if (!callerId) {
                    throw new Error('Invalid callerId');
                }

                if (!io.sockets.adapter.rooms.has(callerId)) {
                    console.warn('Attempted to reject call from non-existent caller:', callerId);
                    return;
                }

                if (videoCallTimeouts.has(callerId)) {
                    clearTimeout(videoCallTimeouts.get(callerId));
                    videoCallTimeouts.delete(callerId);
                }

                io.to(callerId).emit('call_rejected', {
                    userId: socket.user._id.toString(),
                    username: socket.user.username,
                    reason: reason || 'Call declined',
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Error in call rejection:', error);
                socket.emit('call_error', {
                    message: 'Failed to reject call',
                    code: 'REJECT_ERROR'
                });
            }
        });

        socket.on('video_call_ended', ({ roomId }) => {
            try {
                if (!roomId) {
                    throw new Error('Invalid roomId provided');
                }

                if (!activeVideoRooms.has(roomId)) {
                    throw new Error('Call room not found');
                }

                const participants = activeVideoRooms.get(roomId);
                
                if (!participants.has(socket.user._id.toString())) {
                    throw new Error('User not in this call');
                }

                participants.forEach(participantId => {
                    io.to(participantId).emit('call_ended', {
                        reason: 'Call ended by participant',
                        endedBy: {
                            id: socket.user._id.toString(),
                            name: socket.user.username
                        },
                        timestamp: Date.now()
                    });
                });

                activeVideoRooms.delete(roomId);
            } catch (error) {
                console.error('Error ending call:', error);
                socket.emit('call_error', {
                    message: error.message,
                    code: 'END_CALL_ERROR'
                });
            }
        });

        socket.on('webrtc_signal', ({ targetUserId, signal }, callback) => {
            try {
                if (!targetUserId || !signal) {
                  throw new Error('Invalid signal data');
                }
            
                console.log(`Nhận tín hiệu WebRTC từ ${socket.user._id} tới ${targetUserId}`);
                console.log(`userSocketMap có ${userSocketMap.size} mục`);
                console.log(`userSocketMap có chứa ${targetUserId}:`, userSocketMap.has(targetUserId));
                
                const normalizedTargetId = targetUserId.toString();
                const userId = socket.user._id.toString();
                
                const targetSocketId = userSocketMap.get(normalizedTargetId);
                console.log(`Socket ID của người nhận ${normalizedTargetId}: ${targetSocketId || 'không tìm thấy'}`);
                
                const targetSocket = targetSocketId ? io.sockets.sockets.get(targetSocketId) : null;
                console.log(`Tìm thấy socket cho ${normalizedTargetId}: ${targetSocket ? 'có' : 'không'}`);
            
                if (!targetSocket) {
                  console.log(`Người dùng ${normalizedTargetId} không tồn tại hoặc đã ngắt kết nối`);
                  if (callback && typeof callback === 'function') {
                    return callback({ error: 'Người nhận không tồn tại' });
                  } else {
                    socket.emit('call_error', {
                      message: 'Người nhận không tồn tại hoặc đã ngắt kết nối',
                      code: 'RECEIVER_NOT_FOUND'
                    });
                    return;
                  }
                }
                
                let isValidSignal = false;
                let currentRoomId = null;
        
                activeVideoRooms.forEach((participants, roomId) => {
                    if (participants.has(userId) && participants.has(targetUserId)) {
                        isValidSignal = true;
                        currentRoomId = roomId;
                    }
                });
        
                if (!isValidSignal) {
                    throw new Error('Invalid signal: participants not in same call');
                }
        
                const signalWithMeta = {
                    ...signal,
                    metadata: {
                        timestamp: Date.now(),
                        roomId: currentRoomId,
                        from: {
                            id: userId,
                            name: socket.user.username
                        }
                    }
                };
        
                const data = {
                    fromUserId: userId,
                    signal: signalWithMeta
                };
        
                targetSocket.emit('webrtc_signal', data);
                
                if (callback && typeof callback === 'function') {
                    callback({ success: true });
                }
            } catch (error) {
                console.error('WebRTC signal error:', error);
                if (callback && typeof callback === 'function') {
                    callback({ error: error.message });
                } else {
                    socket.emit('call_error', {
                        message: error.message,
                        code: 'SIGNAL_ERROR'
                    });
                }
            }
        });

        socket.on('webrtc_offer', ({ targetUserId, sdp }) => {
            try {
                if (!targetUserId || !sdp) {
                    console.error('Invalid WebRTC offer data');
                    return;
                }
                
                console.log(`[WebRTC] Offer từ ${socket.user._id} đến ${targetUserId}`);
                
                const targetSocketId = userSocketMap.get(targetUserId.toString());
                if (!targetSocketId) {
                    console.log(`[WebRTC] Không tìm thấy socket cho người dùng ${targetUserId}`);
                    socket.emit('webrtc_error', {
                        message: 'Người nhận không trực tuyến hoặc không thể kết nối',
                        code: 'USER_UNAVAILABLE' 
                    });
                    return;
                }
                
                const data = {
                    callerId: socket.user._id.toString(),
                    callerName: socket.user.username, 
                    sdp
                };
                
                console.log(`[WebRTC] Gửi offer đến ${targetUserId}`);
                io.to(targetSocketId).emit('webrtc_offer', data);
            } catch (error) {
                console.error('[WebRTC] Lỗi khi xử lý offer:', error);
                socket.emit('webrtc_error', {
                    message: 'Đã có lỗi xảy ra khi thiết lập kết nối',
                    code: 'OFFER_ERROR'
                });
            }
        });
        
        socket.on('webrtc_answer', ({ targetUserId, sdp }) => {
            try {
                if (!targetUserId || !sdp) {
                    console.error('Invalid WebRTC answer data');
                    return;
                }
                
                console.log(`[WebRTC] Answer từ ${socket.user._id} đến ${targetUserId}`);
                
                const targetSocketId = userSocketMap.get(targetUserId.toString());
                if (!targetSocketId) {
                    console.log(`[WebRTC] Không tìm thấy socket cho người dùng ${targetUserId}`);
                    return;
                }
                
                const data = {
                    callerId: socket.user._id.toString(),
                    sdp
                };
                
                console.log(`[WebRTC] Gửi answer đến ${targetUserId}`);
                io.to(targetSocketId).emit('webrtc_answer', data);
            } catch (error) {
                console.error('[WebRTC] Lỗi khi xử lý answer:', error);
            }
        });
        
        socket.on('webrtc_ice_candidate', ({ targetUserId, candidate }) => {
            try {
                if (!targetUserId || !candidate) {
                    console.error('Invalid ICE candidate data');
                    return;
                }
                
                console.log(`[WebRTC] Chuyển tiếp ICE candidate từ ${socket.user._id} đến ${targetUserId}`);
                
                const targetSocketId = userSocketMap.get(targetUserId.toString());
                if (!targetSocketId) {
                    console.log(`[WebRTC] Không tìm thấy socket cho người dùng ${targetUserId}`);
                    return;
                }
                
                const data = {
                    callerId: socket.user._id.toString(),
                    candidate
                };
                
                io.to(targetSocketId).emit('webrtc_ice_candidate', data);
            } catch (error) {
                console.error('[WebRTC] Lỗi khi xử lý ICE candidate:', error);
            }
        });

        socket.on('check_user_online', ({ targetUserId }, callback) => {
            console.log(`Kiểm tra người dùng ${targetUserId} có trực tuyến không`);
            
            const normalizedId = targetUserId.toString();
            
            console.log(`userSocketMap có ${userSocketMap.size} mục`);
            console.log(`Các ID trong userSocketMap:`, Array.from(userSocketMap.keys()));
            
            const targetSocketId = userSocketMap.get(normalizedId);
            
            const targetSocket = targetSocketId ? io.sockets.sockets.get(targetSocketId) : null;
            
            if (targetSocket) {
              console.log(`Người dùng ${normalizedId} đang trực tuyến với socket: ${targetSocketId}`);
              callback({ online: true });
            } else {
              console.log(`Người dùng ${normalizedId} không trực tuyến`);
              callback({ online: false });
            }
          });
        socket.on('network_quality', ({ roomId, stats }) => {
            try {
                if (!roomId || !stats) {
                    throw new Error('Invalid network quality data');
                }

                if (!activeVideoRooms.has(roomId)) {
                    throw new Error('Call room not found');
                }

                const participants = activeVideoRooms.get(roomId);
                if (!participants.has(socket.user._id.toString())) {
                    throw new Error('User not in this call');
                }

                const normalizedStats = {
                    audio: {
                        bitrate: Number(stats.audio?.bitrate) || 0,
                        packetsLost: Number(stats.audio?.packetsLost) || 0,
                        roundTripTime: Number(stats.audio?.roundTripTime) || 0
                    },
                    video: {
                        bitrate: Number(stats.video?.bitrate) || 0,
                        packetsLost: Number(stats.video?.packetsLost) || 0,
                        roundTripTime: Number(stats.video?.roundTripTime) || 0,
                        frameRate: Number(stats.video?.frameRate) || 0,
                        resolution: stats.video?.resolution || { width: 0, height: 0 }
                    },
                    timestamp: Date.now()
                };

                const audioScore = calculateAudioScore(normalizedStats.audio);
                const videoScore = calculateVideoScore(normalizedStats.video);
                const overallScore = Math.round((audioScore + videoScore) / 2);

                participants.forEach(participantId => {
                    if (participantId !== socket.user._id.toString()) {
                        io.to(participantId).emit('peer_network_quality', {
                            userId: socket.user._id.toString(),
                            username: socket.user.username,
                            stats: normalizedStats,
                            quality: {
                                audio: audioScore,
                                video: videoScore,
                                overall: overallScore
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Network quality error:', error);
            }
        });

        const calculateAudioScore = (stats) => {
            try {
                let score = 100;
                
                score -= stats.packetsLost * 2;
                
                if (stats.roundTripTime > 300) score -= 30;
                else if (stats.roundTripTime > 200) score -= 20;
                else if (stats.roundTripTime > 100) score -= 10;
                
                if (stats.bitrate < 8000) score -= 20;
                else if (stats.bitrate < 16000) score -= 10;
                
                return Math.max(0, Math.min(100, score));
            } catch (error) {
                console.error('Error calculating audio score:', error);
                return 0;
            }
        };

        const calculateVideoScore = (stats) => {
            try {
                let score = 100;
                
                score -= stats.packetsLost * 2;
                
                if (stats.roundTripTime > 300) score -= 30;
                else if (stats.roundTripTime > 200) score -= 20;
                else if (stats.roundTripTime > 100) score -= 10;
                
                if (stats.frameRate < 10) score -= 30;
                else if (stats.frameRate < 15) score -= 20;
                else if (stats.frameRate < 24) score -= 10;
                
                const pixels = stats.resolution.width * stats.resolution.height;
                if (pixels < 307200) score -= 20; 
                else if (pixels < 921600) score -= 10;
                
                return Math.max(0, Math.min(100, score));
            } catch (error) {
                console.error('Error calculating video score:', error);
                return 0;
            }
        };

        socket.on('disconnect', () => {
            const userId = socket.user._id.toString();
            console.log(`Người dùng đã ngắt kết nối: ${userId}`);
            
            userSocketMap.delete(userId);
            activeVideoRooms.forEach((participants, roomId) => {
                if (participants.has(userId)) {
                    participants.delete(userId);
                    if (participants.size === 0) {
                        activeVideoRooms.delete(roomId);
                    } else {
                        participants.forEach(participantId => {
                            if (participantId !== userId) {
                                io.to(participantId).emit('call_ended');
                            }
                        });
                    }
                }
            });

            setUserOnlineStatus(userId, false);
            io.emit('user_offline', userId);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io chưa được khởi tạo');
    }
    return io;
};

const sendNotification = async (recipientId, notification) => {
    try {
        const io = getIO();
        io.to(recipientId.toString()).emit('notification', notification);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

module.exports = {
    setupSocket,
    getIO,
    sendNotification
};