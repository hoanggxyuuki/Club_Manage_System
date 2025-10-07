const Event = require('../models/eventSchema');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const crypto = require('crypto');
const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize'); 


const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


const sanitizeInput = (data) => {
  if (!data) return data;
  if (typeof data === 'string') return data.trim().replace(/[<>]/g, '');
  if (Array.isArray(data)) return data.map(item => sanitizeInput(item));
  if (typeof data === 'object') {
    const sanitizedData = {};
    Object.keys(data).forEach(key => {
      sanitizedData[key] = sanitizeInput(data[key]);
    });
    return sanitizedData;
  }
  return data;
};

const generateQRValue = (eventId) => {
  
  const randomSalt = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now().toString(36);
  const code = crypto.randomBytes(16).toString('hex') + randomSalt + timestamp;
  
  
  const frontendUrl = `${process.env.FRONTEND_URL}/member/events/attendance/${eventId}/${code}`;
  
  
  return {
    code,
    raw: `${eventId}/${code}`, 
    value: `${process.env.API_URL}/api/events/attendance/${eventId}/${code}`,
    displayUrl: frontendUrl, 
    displayValue: frontendUrl 
  };
};

exports.getMonthEvents = async (req, res) => {
  try {
    
    const timeoutOption = { maxTimeMS: 10000 };
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    
    const limit = 100;

    const events = await Event.find({
      startDate: { 
        $gte: startOfMonth,
        $lte: endOfMonth 
      }
    }, null, timeoutOption)
    .populate('creator', 'username')
    .populate('participants.userId', 'username email')
    .sort({ startDate: 1 })
    .limit(limit);

    res.status(200).json(events);
  } catch (error) {
    console.error('Lỗi khi lấy sự kiện trong tháng:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải danh sách sự kiện. Vui lòng thử lại sau.' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    
    const sanitizedInput = sanitizeInput(sanitize(req.body));
    
    const {
      name,
      description,
      startDate,
      endDate,
      location,
      eventType,
      managingUnit,
      supervisors
    } = sanitizedInput;

    
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Tên sự kiện, thời gian bắt đầu và kết thúc là bắt buộc' });
    }
    
    
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'Thời gian kết thúc không thể sớm hơn thời gian bắt đầu' });
    }
    
    const newEvent = new Event({
      name,
      description,
      startDate,
      endDate,
      location,
      eventType: eventType || 'optional',
      managingUnit,
      supervisors: supervisors || [],
      creator: req.user.id,
      participants: [{
        userId: req.user.id,
        status: 'confirmed'
      }]
    });

    if (eventType === 'required') {
      
      const allUsers = await User.find({ role: { $in: ['member', 'leader'] } })
        .select('_id')
        .limit(1000);
        
      allUsers.forEach(user => {
        if (user._id.toString() !== req.user.id) {
          newEvent.participants.push({
            userId: user._id,
            status: eventType === 'required' ? 'confirmed' : 'pending' 
          });
        }
      });
    }

    
    await newEvent.save();
    
    const qrData = generateQRValue(newEvent._id);
    newEvent.qrCode = {
      code: qrData.code,
      raw: qrData.raw,
      value: qrData.value,
      displayUrl: qrData.displayUrl,
      expiresAt: new Date(endDate)
    };

    await newEvent.save();

    
    const allUsers = await User.find({ _id: { $ne: req.user.id } })
      .select('_id')
      .limit(1000);
      
    const userIds = allUsers.map(user => user._id);

    
    createNotification({
      body: {
        title: 'Sự kiện mới được tạo',
        message: `${req.user.username} đã tạo một sự kiện mới: ${name}`,
        type: 'event',
        recipients: userIds,
        url: `/member/events`
      },
      user: req.user
    }).catch(err => console.error('Lỗi gửi thông báo:', err));

    
    const eventResponse = {
      ...newEvent.toObject(),
      qrCode: {
        ...newEvent.qrCode,
        
        code: undefined
      }
    };

    res.status(201).json(eventResponse);
  } catch (error) {
    console.error('Lỗi khi tạo sự kiện:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tạo sự kiện. Vui lòng thử lại sau.' });
  }
};

exports.verifyAttendance = async (req, res) => {
  try {
    
    const { qrCode, redirectedFromLogin, clientIp } = sanitize(req.body);
    
    if (!qrCode) {
      return res.status(400).json({ message: 'Mã QR là bắt buộc' });
    }

    let eventId, code;
    try {
      
      let url;
      try {
        url = new URL(qrCode);
      } catch {
        
        if (qrCode.includes('/')) {
          [eventId, code] = qrCode.split('/');
        } else {
          code = qrCode;
        }
      }

      if (url) {
        
        const pathParts = url.pathname.split('/');
        const attendanceIndex = pathParts.indexOf('attendance');
        if (attendanceIndex !== -1 && attendanceIndex + 2 < pathParts.length) {
          eventId = pathParts[attendanceIndex + 1];
          code = pathParts[attendanceIndex + 2];
        }
      }
    } catch (error) {
      return res.status(400).json({ message: 'Định dạng mã QR không hợp lệ' });
    }

    if (!code) {
      return res.status(400).json({ message: 'Mã QR không hợp lệ' });
    }

    
    if (eventId && !isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'ID sự kiện không hợp lệ' });
    }

    
    if (code.length > 200) {
      return res.status(400).json({ message: 'Mã QR không hợp lệ' });
    }

    
    const timeoutOption = { maxTimeMS: 5000 };
    
    
    const event = await Event.findOne({
      $or: [
        
        { _id: eventId, 'qrCode.code': code },
        
        { 'qrCode.raw': `${eventId}/${code}` },
        
        { 'qrCode.code': code },
        
        { _id: eventId, 'qrCode.value': code }
      ]
    }, null, timeoutOption).populate('creator participants.userId');

    if (!event) {
      return res.status(404).json({ message: 'Mã QR không hợp lệ' });
    }

    if (event.qrCode.expiresAt < new Date()) {
      return res.status(404).json({ message: 'Mã QR đã hết hạn' });
    }

    
    const participant = event.participants.find(p => {
      const participantId = p.userId?._id || p.userId;
      return participantId.toString() === req.user.id.toString() && p.status === 'confirmed';
    });

    if (!participant) {
      return res.status(403).json({
        message: 'Bạn chưa được xác nhận tham gia sự kiện này'
      });
    }

    if (participant.attendance && participant.attendance.isPresent) {
      return res.status(400).json({ message: 'Bạn đã điểm danh trước đó' });
    }

    
    let ipv4;
    if (redirectedFromLogin && clientIp) {
      ipv4 = clientIp;
    } else {
      const ip = req.clientIp;
      ipv4 = ip;
      if (ip.includes('::ffff:')) {
        
        ipv4 = ip.split('::ffff:')[1];
      } else if (ip === '::1') {
        
        ipv4 = '127.0.0.1';
      }
    }

    
    const maskedIp = ipv4.split('.').slice(0, 3).join('.') + '.xxx';

    participant.attendance = {
      isPresent: true,
      checkInTime: new Date(),
      ipAddress: maskedIp
    };

    await event.save();

    
    createNotification({
      body: {
        title: 'Đã điểm danh',
        message: `${req.user.username} đã điểm danh sự kiện: ${event.name}`,
        type: 'event',
        recipients: [event.creator],
        url: `/member/events`
      },
      user: req.user
    }).catch(err => console.error('Lỗi gửi thông báo:', err));

    res.status(200).json({ 
      message: 'Điểm danh thành công!',
      eventName: event.name,
      checkInTime: participant.attendance.checkInTime
    });
  } catch (error) {
    
    console.error('Lỗi khi xác nhận điểm danh:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xác nhận điểm danh. Vui lòng thử lại sau.' });
  }
};

exports.handleExternalQRScan = async (req, res) => {
  try {
    const { eventId, code } = req.params;

    
    const event = await Event.findOne({
      $or: [
        
        { _id: eventId, 'qrCode.code': code },
        
        { 'qrCode.raw': `${eventId}/${code}` },
        
        { 'qrCode.code': code },
        
        { _id: eventId, 'qrCode.value': code }
      ]
    }).populate('creator participants.userId');

    if (!event) {
      return res.status(404).send(`
        <html>
          <body>
            <h2>Mã QR không hợp lệ</h2>
            <p>Sự kiện không tồn tại hoặc mã QR đã hết hạn.</p>
          </body>
        </html>
      `);
    }

    if (event.qrCode.expiresAt < new Date()) {
      return res.status(404).send(`
        <html>
          <body>
            <h2>Mã QR đã hết hạn</h2>
            <p>Vui lòng yêu cầu mã QR mới từ ban tổ chức.</p>
          </body>
        </html>
      `);
    }

    const baseUrl = process.env.FRONTEND_URL;

    
    if (!req.user) {
      
      const ip = req.clientIp;
      let ipv4 = ip;
      if (ip.includes('::ffff:')) {
        ipv4 = ip.split('::ffff:')[1];
      } else if (ip === '::1') {
        ipv4 = '127.0.0.1';
      }

      
      const loginUrl = new URL(`${baseUrl}/login`);
      loginUrl.searchParams.set('redirect', '/member/events');
      loginUrl.searchParams.set('eventId', eventId);
      loginUrl.searchParams.set('code', code);
      loginUrl.searchParams.set('ip', ipv4);
      loginUrl.searchParams.set('autoScan', 'true');
      
      return res.redirect(loginUrl.toString());
    }

    
    const participant = event.participants.find(p => {
      const participantId = p.userId?._id || p.userId;
      return participantId.toString() === req.user.id.toString() && p.status === 'confirmed';
    });

    if (!participant) {
      return res.status(403).send(`
        <html>
          <body>
            <h2>Không có quyền tham gia</h2>
            <p>Bạn chưa được xác nhận tham gia sự kiện này.</p>
            <a href="${baseUrl}/member/events">Về trang sự kiện</a>
          </body>
        </html>
      `);
    }

    if (participant.attendance && participant.attendance.isPresent) {
      return res.status(200).send(`
        <html>
          <body>
            <h2>Đã điểm danh</h2>
            <p>Bạn đã điểm danh sự kiện "${event.name}" thành công trước đó.</p>
            <a href="${baseUrl}/member/events">Về trang sự kiện</a>
          </body>
        </html>
      `);
    }

    
    const ip = req.clientIp;
    let ipv4 = ip;
    if (ip.includes('::ffff:')) {
      
      ipv4 = ip.split('::ffff:')[1];
    } else if (ip === '::1') {
      
      ipv4 = '127.0.0.1';
    }

    
    const maskedIp = ipv4.split('.').slice(0, 3).join('.') + '.xxx';

    participant.attendance = {
      isPresent: true,
      checkInTime: new Date(),
      ipAddress: maskedIp
    };

    await event.save();

    await createNotification({
      body: {
        title: 'Đã điểm danh',
        message: `${req.user.username} đã điểm danh sự kiện: ${event.name}`,
        type: 'event',
        recipients: [event.creator],
        url: `/member/events`
      },
      user: req.user
    });

    
    const successUrl = new URL(`${baseUrl}/member/events`);
    successUrl.searchParams.set('attendanceSuccess', 'true');
    successUrl.searchParams.set('eventName', event.name);
    
    res.redirect(successUrl.toString());
  } catch (error) {
    const baseUrl = process.env.FRONTEND_URL;
    res.status(500).send(`
      <html>
        <body>
          <h2>Có lỗi xảy ra</h2>
          <p>Vui lòng thử lại sau hoặc liên hệ ban tổ chức.</p>
          <a href="${baseUrl}/member/events">Về trang sự kiện</a>
        </body>
      </html>
    `);
  }
};

exports.refreshQRCode = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'ID sự kiện không hợp lệ' });
    }
    
    
    const event = await Event.findById(eventId).maxTimeMS(5000);
    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }

    
    if (event.creator.toString() !== req.user.id && !['admin', 'leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ người tạo sự kiện mới có thể làm mới mã QR' });
    }

    const qrData = generateQRValue(event._id);
    event.qrCode = {
      code: qrData.code,
      raw: qrData.raw,
      value: qrData.value,
      displayUrl: qrData.displayUrl,
      expiresAt: event.endDate
    };

    await event.save();

    
    const qrResponse = {
      qrCode: {
        ...event.qrCode,
        displayValue: event.qrCode.displayUrl,
        code: undefined  
      }
    };

    res.status(200).json(qrResponse);
  } catch (error) {
    console.error('Lỗi khi làm mới mã QR:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi làm mới mã QR. Vui lòng thử lại sau.' });
  }
};

exports.getEvents = async (req, res) => {
  try {
    
    const { status = 'active' } = sanitize(req.query);
    
    
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    
    const timeoutOption = { maxTimeMS: 10000 };

    const events = await Event.find({ status }, null, timeoutOption)
      .populate('creator', 'username')
      .populate('participants.userId', 'username email')
      .populate('supervisors.userId', 'username email')
      .skip(skip)
      .limit(limit)
      .lean();

    
    const eventsWithUrls = events.map(event => {
      if (event.qrCode) {
        event.qrCode = {
          displayUrl: event.qrCode.displayUrl,
          displayValue: event.qrCode.displayUrl || event.qrCode.value,
          expiresAt: event.qrCode.expiresAt,
          
          code: undefined,
          raw: undefined,
          value: undefined
        };
      }
      return event;
    });

    res.status(200).json(eventsWithUrls);
  } catch (error) {
    console.error('Lỗi khi tải danh sách sự kiện:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải danh sách sự kiện. Vui lòng thử lại sau.' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'ID sự kiện không hợp lệ' });
    }
    
    
    const event = await Event.findById(eventId)
      .populate('creator', 'username email')
      .populate('participants.userId', 'username email')
      .populate('supervisors.userId', 'username email')
      .maxTimeMS(5000)
      .lean();

    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }

    
    if (event.qrCode) {
      
      const isCreatorOrAdmin = event.creator._id.toString() === req.user.id || 
                              ['admin', 'leader'].includes(req.user.role);
      
      event.qrCode = {
        displayUrl: isCreatorOrAdmin ? event.qrCode.displayUrl : undefined,
        displayValue: isCreatorOrAdmin ? (event.qrCode.displayUrl || event.qrCode.value) : undefined,
        expiresAt: event.qrCode.expiresAt,
        
        code: undefined,
        raw: undefined,
        value: undefined
      };
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Lỗi khi tải thông tin sự kiện:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải thông tin sự kiện. Vui lòng thử lại sau.' });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Người dùng không được xác thực' });
    }

    const existingParticipant = event.participants.find(
      p => p.userId && p.userId.toString() === req.user.id.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({ message: 'Đã tham gia sự kiện này' });
    }

    event.participants.push({
      userId: req.user.id,
      status: 'pending'
    });

    await event.save();

    await createNotification({
      body: {
        title: 'New Event Participant',
        message: `${req.user.username} has joined your event: ${event.name}`,
        type: 'event',
        recipients: [event.creator],
        url: `/member/events`
      },
      user: req.user
    });

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateParticipantStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }

    let participantIndex = event.participants.findIndex(
      p => p.userId && p.userId.toString() === req.user.id.toString()
    );

    
    if (participantIndex === -1) {
      event.participants.push({
        userId: req.user.id,
        status: status
      });
      participantIndex = event.participants.length - 1;
    } else {
      
      event.participants[participantIndex].status = status;
    }
    
    await event.save();

    if (event.creator.toString() !== req.user.id) {
      await createNotification({
        body: {
          title: 'Event Response Updated',
          message: `${req.user.username} has ${status} the event: ${event.name}`,
          type: 'event',
          recipients: [event.creator],
          url: `/member/events`
        },
        user: req.user
      });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'ID sự kiện không hợp lệ' });
    }
    
    
    const sanitizedInput = sanitizeInput(sanitize(req.body));
    
    const {
      name,
      description,
      startDate,
      endDate,
      location,
      eventType,
      managingUnit,
      supervisors
    } = sanitizedInput;
    
    const event = await Event.findById(eventId).maxTimeMS(5000);
    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }

    
    if (event.creator.toString() !== req.user.id && !['admin', 'leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Không có quyền cập nhật sự kiện này' });
    }

    
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'Thời gian kết thúc không thể sớm hơn thời gian bắt đầu' });
    }

    
    if (name) event.name = name;
    if (description) event.description = description;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (location) event.location = location;

    
    if (eventType) {
      
      if (eventType === 'required' && event.eventType === 'optional') {
        
        const allUsers = await User.find({ role: { $in: ['member', 'leader'] } })
          .select('_id')
          .limit(1000);
          
        const currentParticipantIds = event.participants.map(p => p.userId.toString());
        
        allUsers.forEach(user => {
          
          if (!currentParticipantIds.includes(user._id.toString())) {
            event.participants.push({
              userId: user._id,
              status: 'confirmed'
            });
          }
          
          else {
            const participantIndex = event.participants.findIndex(p =>
              p.userId.toString() === user._id.toString()
            );
            if (participantIndex !== -1) {
              event.participants[participantIndex].status = 'confirmed';
            }
          }
        });
        
        
        const notifyUserIds = allUsers
          .map(user => user._id.toString())
          .filter(id => id !== req.user.id);

        if (notifyUserIds.length > 0) {
          createNotification({
            body: {
              title: 'Cập nhật trạng thái sự kiện',
              message: `Sự kiện "${event.name}" đã chuyển thành bắt buộc và bạn đã được tự động xác nhận tham gia.`,
              type: 'event',
              recipients: notifyUserIds,
              url: '/member/events'
            },
            user: req.user
          }).catch(err => console.error('Lỗi gửi thông báo:', err));
        }
      }
      event.eventType = eventType;
    }
    
    if (managingUnit) {
      event.managingUnit = managingUnit;
    }

    if (supervisors) {
      event.supervisors = supervisors;
    }

    
    if (event.qrCode) {
      event.qrCode.expiresAt = new Date(endDate);
    }

    await event.save();

    const baseUrl = process.env.FRONTEND_URL;
    const displayUrl = event.qrCode ? `${baseUrl}/member/events/attendance/${event._id}/${event.qrCode.code}` : null;

    
    const eventResponse = {
      ...event.toObject(),
      qrCode: event.qrCode ? {
        expiresAt: event.qrCode.expiresAt,
        displayUrl: displayUrl,
        displayValue: displayUrl,
        
        code: undefined,
        raw: undefined,
        value: undefined
      } : null
    };

    res.status(200).json(eventResponse);
  } catch (error) {
    console.error('Lỗi khi cập nhật sự kiện:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật sự kiện. Vui lòng thử lại sau.' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'ID sự kiện không hợp lệ' });
    }
    
    const event = await Event.findById(eventId).maxTimeMS(5000);
    if (!event) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }

    
    if (event.creator.toString() !== req.user.id && !['admin', 'leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Không có quyền xóa sự kiện này' });
    }

    await Event.findByIdAndDelete(eventId);

    
    const participantIds = event.participants
      .map(p => p.userId.toString())
      .filter(id => id !== req.user.id);

    if (participantIds.length > 0) {
      createNotification({
        body: {
          title: 'Sự kiện đã bị xóa',
          message: `Sự kiện "${event.name}" đã bị xóa bởi ${req.user.username}`,
          type: 'event',
          recipients: participantIds,
          url: `/member/events`
        },
        user: req.user
      }).catch(err => console.error('Lỗi gửi thông báo:', err));
    }

    res.status(200).json({ message: 'Xóa sự kiện thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa sự kiện:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xóa sự kiện. Vui lòng thử lại sau.' });
  }
};
