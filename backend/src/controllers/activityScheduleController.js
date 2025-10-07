const ActivitySchedule = require('../models/ActivitySchedule');
const { createNotification } = require('./notificationController');
const Group = require('../models/Group');

exports.createActivitySchedule = async (req, res) => {
  try {
    const { groupId, title, description, startTime, endTime, location, recurringType, maxParticipants } = req.body;

    
    if (recurringType && !['none', 'daily', 'weekly', 'monthly'].includes(recurringType)) {
      return res.status(400).json({ message: 'Kiểu lặp lại không hợp lệ' });
    }

    
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
    }

    const schedule = new ActivitySchedule({
      groupId,
      title,
      description,
      startTime: start,
      endTime: end,
      location,
      recurringType: recurringType || 'none',
      maxParticipants,
      createdBy: req.user.id
    });

    await schedule.save();

    
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Không tìm thấy nhóm');
    }

    const memberIds = group.members.map(member => member.userId.toString());

    
    let message = `Một lịch sinh hoạt mới "${title}" đã được tạo`;
    if (recurringType && recurringType !== 'none') {
      message += ` (Lặp lại ${
        recurringType === 'daily' ? 'hàng ngày' :
        recurringType === 'weekly' ? 'hàng tuần' :
        'hàng tháng'
      })`;
    }

    
    const notification = {
      title: 'Lịch sinh hoạt mới',
      message,
      type: 'schedule',
      groupId,
      sender: req.user.id,
      recipients: memberIds
    };

    await createNotification({ body: notification, user: req.user });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo lịch sinh hoạt', error: error.message });
  }
};

exports.getGroupSchedules = async (req, res) => {
  try {
    const { groupId } = req.params;
    const schedules = await ActivitySchedule.find({ groupId })
      .populate('createdBy', 'username')
      .populate('attendees.userId', 'username')
      .sort({ startTime: 1 });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy lịch sinh hoạt', error: error.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    update.updatedAt = Date.now();

    const schedule = await ActivitySchedule.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch sinh hoạt' });
    }

    
    
    const Group = require('../models/Group');
    const group = await Group.findById(schedule.groupId);
    if (!group) {
      throw new Error('Không tìm thấy nhóm');
    }

    const memberIds = group.members.map(member => member.userId.toString());

    const notification = {
      title: 'Cập nhật lịch sinh hoạt',
      message: `Lịch sinh hoạt "${schedule.title}" đã được cập nhật`,
      type: 'schedule',
      groupId: schedule.groupId,
      sender: req.user.id,
      recipients: memberIds
    };

    await createNotification({ body: notification, user: req.user });

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật lịch sinh hoạt', error: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await ActivitySchedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch sinh hoạt' });
    }

    const group = await Group.findById(schedule.groupId);
    if (!group) {
      throw new Error('Không tìm thấy nhóm');
    }

    const memberIds = group.members.map(member => member.userId.toString());

    const notification = {
      title: 'Xóa lịch sinh hoạt',
      message: `Lịch sinh hoạt "${schedule.title}" đã bị xóa`,
      type: 'schedule',
      groupId: schedule.groupId,
      sender: req.user.id,
      recipients: memberIds
    };

    await createNotification({ body: notification, user: req.user });
    res.json({ message: 'Đã xóa lịch sinh hoạt thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa lịch sinh hoạt', error: error.message });
  }
};

exports.joinSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const schedule = await ActivitySchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch sinh hoạt' });
    }

    if (schedule.attendees.some(attendee => attendee.userId.toString() === userId)) {
      return res.status(400).json({ message: 'Bạn đã tham gia lịch này rồi' });
    }

    schedule.attendees.push({
      userId: userId,
      status: 'pending'
    });

    await schedule.save();

    const group = await Group.findById(schedule.groupId);
    const leaderIds = group.members
      .filter(member => ['leader', 'owner'].includes(member.role))
      .map(member => member.userId.toString());
    const notification = {
      title: 'Đăng ký tham gia',
      message: `${req.user.username} đã đăng ký tham gia "${schedule.title}"`,
      type: 'schedule',
      groupId: schedule.groupId,
      sender: userId,
      recipients: leaderIds
    };

    await createNotification({ body: notification, user: req.user });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đăng ký tham gia', error: error.message });
  }
};
exports.updateAttendeeStatus = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { status, notes } = req.body;

    const schedule = await ActivitySchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch sinh hoạt' });
    }

    const attendee = schedule.attendees.find(
      a => a.userId.toString() === userId
    );

    if (!attendee) {
      return res.status(404).json({ message: 'Không tìm thấy người tham gia' });
    }

    attendee.status = status;
    if (status === 'attended') {
      attendee.checkedInAt = new Date();
    }
    if (notes) {
      attendee.notes = notes;
    }

    await schedule.save();

    const notification = {
      title: 'Cập nhật trạng thái tham gia',
      message: `Trạng thái tham gia của bạn trong "${schedule.title}" đã được cập nhật thành ${status}`,
      type: 'schedule',
      groupId: schedule.groupId,
      sender: req.user.id,
      recipients: [userId]
    };

    await createNotification({ body: notification, user: req.user });
    res.json({ message: 'Đã cập nhật trạng thái thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: error.message });
  }
};
    
exports.getAttendanceStats = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await ActivitySchedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch sinh hoạt' });
    }

    const stats = schedule.getAttendanceStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thống kê', error: error.message });
  }
};