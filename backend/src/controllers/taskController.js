const Task = require('../models/Task');
const Group = require('../models/Group');
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');


const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};


const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
};

exports.createTask = async (req, res) => {
    try {
        const { title, description, groupId, assignedTo, dueDate, priority } = req.body;
        
        
        if (!title || !groupId || !assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }
        
        
        if (!isValidObjectId(groupId)) {
            return res.status(400).json({ message: 'ID nhóm không hợp lệ' });
        }
        
        
        const invalidIds = assignedTo.filter(id => !isValidObjectId(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ message: 'Một số ID người dùng không hợp lệ' });
        }

        
        const sanitizedTitle = sanitizeInput(title);
        const sanitizedDescription = sanitizeInput(description);

        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }

        const isLeader = group.members.some(member => 
            member.userId.toString() === req.user._id.toString() && 
            (member.role === 'leader' || member.role === 'owner')
        );

        if (!isLeader) {
            return res.status(403).json({ message: 'Chỉ quản lý nhóm mới có thể tạo công việc' });
        }

        
        const invalidMembers = assignedTo.filter(userId => 
            !group.members.some(member => member.userId.toString() === userId.toString())
        );

        if (invalidMembers.length > 0) {
            return res.status(400).json({ message: 'Một số người được chọn không phải là thành viên nhóm' });
        }

        const task = new Task({
            title: sanitizedTitle,
            description: sanitizedDescription,
            groupId,
            assignedTo,
            assignedBy: req.user._id,
            dueDate,
            priority
        });

        await task.save();

        
        await createNotification({
            body: {
                title: 'Công việc mới',
                message: `Bạn được giao công việc: ${sanitizedTitle}`,
                type: 'task',
                recipients: assignedTo,
                groupId,
                taskId: task._id
            },
            user: req.user
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Lỗi tạo task:', error);
        res.status(400).json({ message: 'Có lỗi xảy ra khi tạo công việc' });
    }
};

exports.updateTaskProgress = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { progress, status } = req.body;
        
        
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ message: 'ID công việc không hợp lệ' });
        }
        
        
        if (progress === undefined || progress < 0 || progress > 100) {
            return res.status(400).json({ message: 'Tiến độ công việc phải từ 0-100%' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        
        if (!task.assignedTo.some(userId => userId.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Bạn không được phân công cho công việc này' });
        }

        const oldProgress = task.progress;
        task.progress = progress;
        if (status) task.status = status;

        
        if (progress === 100) {
            task.status = 'awaiting_confirmation';
        }

        await task.save();

        
        await createNotification({
            body: {
                title: 'Cập nhật tiến độ công việc',
                message: `Công việc "${task.title}" tiến độ đã được cập nhật từ ${oldProgress}% lên ${progress}%`,
                type: 'task',
                recipients: [task.assignedBy],
                groupId: task.groupId,
                taskId: task._id
            },
            user: req.user
        });

        
        if (task.status === 'awaiting_confirmation') {
            await createNotification({
                body: {
                    title: 'Yêu cầu xác nhận hoàn thành công việc',
                    message: `Công việc "${task.title}" đã được báo cáo hoàn thành và đang chờ xác nhận`,
                    type: 'task',
                    recipients: [task.assignedBy],
                    groupId: task.groupId,
                    taskId: task._id
                },
                user: req.user
            });
        }

        res.json(task);
    } catch (error) {
        console.error('Lỗi cập nhật task:', error);
        res.status(400).json({ message: 'Có lỗi xảy ra khi cập nhật tiến độ' });
    }
};

exports.confirmTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ message: 'ID công việc không hợp lệ' });
        }
        
        const task = await Task.findById(taskId).populate('groupId');
        
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        
        const isLeaderOrCreator = task.assignedBy.toString() === req.user._id.toString() ||
            (task.groupId.members.some(member =>
                member.userId.toString() === req.user._id.toString() &&
                (member.role === 'leader' || member.role === 'owner')
            ));

        if (!isLeaderOrCreator) {
            return res.status(403).json({ message: 'Bạn không có quyền xác nhận công việc này' });
        }

        if (task.status !== 'awaiting_confirmation') {
            return res.status(400).json({ message: 'Công việc không ở trạng thái chờ xác nhận' });
        }

        
        task.leaderConfirmation = {
            confirmed: true,
            confirmedBy: req.user._id,
            confirmedAt: new Date()
        };
        task.status = 'completed';
        task.sortOrder = 1;

        await task.save();

        
        await createNotification({
            body: {
                title: 'Công việc đã được xác nhận hoàn thành',
                message: `Công việc "${task.title}" đã được xác nhận hoàn thành bởi quản lý`,
                type: 'task',
                recipients: task.assignedTo,
                groupId: task.groupId._id,
                taskId: task._id
            },
            user: req.user
        });

        res.json(task);
    } catch (error) {
        console.error('Lỗi xác nhận task:', error);
        res.status(400).json({ message: 'Có lỗi xảy ra khi xác nhận công việc' });
    }
};

exports.getGroupTasks = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        
        if (!isValidObjectId(groupId)) {
            return res.status(400).json({ message: 'ID nhóm không hợp lệ' });
        }

        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }

        const member = group.members.find(m => m.userId.toString() === req.user._id.toString());
        if (!member) {
            return res.status(403).json({ message: 'Bạn không phải thành viên của nhóm này' });
        }

        
        
        let query = { groupId };
        
        
        if (member.role === 'leader') {
            query = {
                groupId,
                $or: [
                    { assignedBy: req.user._id },
                    { assignedTo: req.user._id }
                ]
            };
        } else if (member.role === 'owner') {
            
            query = { groupId };
        } else {
            
            query = {
                groupId,
                assignedTo: req.user._id
            };
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'username email avatar')
            .populate('assignedBy', 'username email avatar')
            .populate('groupId', 'name')
            .sort({ sortOrder: 1, dueDate: 1, createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        console.error('Lỗi lấy danh sách task của nhóm:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách công việc' });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ message: 'ID công việc không hợp lệ' });
        }
        
        const task = await Task.findById(taskId)
            .populate('assignedTo', 'username email avatar')
            .populate('assignedBy', 'username email avatar')
            .populate('groupId', 'name');

        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        
        const isAssignee = task.assignedTo.some(userId => userId._id.toString() === req.user._id.toString());
        const isCreator = task.assignedBy._id.toString() === req.user._id.toString();
        
        if (!isAssignee && !isCreator) {
            
            const group = await Group.findById(task.groupId);
            const isLeaderOrOwner = group && group.members.some(m => 
                m.userId.toString() === req.user._id.toString() && 
                (m.role === 'leader' || m.role === 'owner')
            );
            
            if (!isLeaderOrOwner) {
                return res.status(403).json({ message: 'Bạn không có quyền xem công việc này' });
            }
        }

        res.json(task);
    } catch (error) {
        console.error('Lỗi lấy thông tin task:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy thông tin công việc' });
    }
};

exports.getAllTasks = async (req, res) => {
    try {
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        if (limit > 100) {
            return res.status(400).json({ message: 'Giới hạn tối đa là 100 công việc mỗi trang' });
        }
        
        const skip = (page - 1) * limit;
        
        
        const leaderGroups = await Group.find({
            'members': {
                $elemMatch: {
                    userId: req.user._id,
                    role: { $in: ['leader', 'owner'] }
                }
            }
        });

        const groupIds = leaderGroups.map(g => g._id);

        
        
        
        const query = {
            $or: [
                { assignedTo: req.user._id },
                {
                    $and: [
                        { assignedBy: req.user._id },
                        { groupId: { $in: groupIds } }
                    ]
                }
            ]
        };

        const tasks = await Task.find(query)
            .populate('assignedTo', 'username email avatar')
            .populate('assignedBy', 'username email avatar')
            .populate('groupId', 'name')
            .sort({ sortOrder: 1, dueDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        res.json(tasks);
    } catch (error) {
        console.error('Lỗi lấy danh sách tất cả task:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách công việc' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        
        if (!isValidObjectId(taskId)) {
            return res.status(400).json({ message: 'ID công việc không hợp lệ' });
        }
        
        const task = await Task.findById(taskId)
            .populate('groupId');
        
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        
        const group = await Group.findById(task.groupId);
        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }
        
        const isLeader = group.members.some(member => 
            member.userId.toString() === req.user._id.toString() && 
            (member.role === 'leader' || member.role === 'owner')
        );

        if (task.assignedBy.toString() !== req.user._id.toString() && !isLeader) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa công việc này' });
        }

        
        await createNotification({
            body: {
                title: 'Công việc đã bị xóa',
                message: `Công việc "${task.title}" đã bị xóa`,
                type: 'task',
                recipients: task.assignedTo,
                groupId: task.groupId
            },
            user: req.user
        });

        await Task.findByIdAndDelete(taskId);
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        console.error('Lỗi xóa task:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xóa công việc' });
    }
};