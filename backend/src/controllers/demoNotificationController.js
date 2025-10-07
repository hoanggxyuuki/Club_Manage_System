const DemoNotification = require('../models/DemoNotification');
const User = require('../models/User');
const { validationResult } = require('express-validator');


exports.getAllDemoNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notifications = await DemoNotification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    const total = await DemoNotification.countDocuments();

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving demo notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách thông báo'
    });
  }
};


exports.getActiveDemoNotifications = async (req, res) => {
  try {
    const notifications = await DemoNotification.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching active demo notifications:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy thông báo demo đang hoạt động' });
  }
};


exports.getDemoNotificationById = async (req, res) => {
  try {
    const notification = await DemoNotification.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error retrieving demo notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông báo'
    });
  }
};


exports.createDemoNotification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, content, status, targetUsers, showToAllPending, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung là bắt buộc'
      });
    }

    const newNotification = new DemoNotification({
      title,
      content,
      status: status || 'info',
      targetUsers: targetUsers || [],
      showToAllPending: showToAllPending || false,
      createdBy: req.user?.id,
      expiresAt: expiresAt || new Date(+new Date() + 30*24*60*60*1000)
    });

    await newNotification.save();

    return res.status(201).json({
      success: true,
      message: 'Thông báo đã được tạo thành công',
      data: newNotification
    });
  } catch (error) {
    console.error('Error creating demo notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thông báo'
    });
  }
};


exports.updateDemoNotification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, content, status, targetUsers, showToAllPending, expiresAt, isActive } = req.body;

    const notification = await DemoNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    
    if (title) notification.title = title;
    if (content) notification.content = content;
    if (status) notification.status = status;
    if (targetUsers) notification.targetUsers = targetUsers;
    if (showToAllPending !== undefined) notification.showToAllPending = showToAllPending;
    if (expiresAt) notification.expiresAt = expiresAt;
    if (isActive !== undefined) notification.isActive = isActive;

    notification.updatedAt = Date.now();

    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Thông báo đã được cập nhật thành công',
      data: notification
    });
  } catch (error) {
    console.error('Error updating demo notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông báo'
    });
  }
};


exports.deleteDemoNotification = async (req, res) => {
  try {
    const notification = await DemoNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    await DemoNotification.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Thông báo đã được xóa thành công'
    });
  } catch (error) {
    console.error('Error deleting demo notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thông báo'
    });
  }
};


exports.getDemoNotificationsForPendingUser = async (req, res) => {
  try {
    
    const notifications = await DemoNotification.find({
      $or: [
        { showToAllPending: true },
        { targetUsers: req.user.id }
      ],
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .lean();

    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error retrieving demo notifications for pending user:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách thông báo'
    });
  }
};