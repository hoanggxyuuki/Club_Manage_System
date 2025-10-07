const Group = require('../models/Group');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.replace(/<[^>]*>?/gm, '').trim();
    }
    return input;
};

exports.createGroup = async (req, res) => {
    try {
        const name = sanitizeInput(req.body.name);
        const description = sanitizeInput(req.body.description);
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Tên nhóm không được để trống' });
        }
        
        if (!['admin', 'leader'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Chỉ chủ sở hữu và người quản lý mới có thể tạo nhóm' });
        }

        const group = new Group({
            name,
            description,
            createdById: req.user._id,
            members: [{ userId: req.user._id, role: 'leader' }] 
        });

        await group.save();

        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(admin => admin._id);

        await createNotification({
            body: {
                title: 'Tạo nhóm mới',
                message: `${req.user.username} đã tạo một nhóm mới: ${name}`,
                type: 'group',
                recipients: adminIds
            },
            user: req.user
        });

        res.status(201).json(group);
    } catch (error) {
        console.error('Lỗi khi tạo nhóm:', error);
        res.status(400).json({ message: 'Có lỗi xảy ra khi tạo nhóm' });
    }
};

exports.addMemberToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;
        
        if (!isValidObjectId(groupId) || !isValidObjectId(userId)) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Không tồn tại nhóm' });
        }

        const requesterMember = group.members.find(m => m.userId.toString() === req.user._id.toString());
        if (!requesterMember || !['owner', 'leader'].includes(requesterMember.role)) {
            return res.status(403).json({ message: 'Không có quyền thêm thành viên' });
        }

        const userToAdd = await User.findById(userId).select('_id username');
        if (!userToAdd) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (group.members.some(m => m.userId.toString() === userId)) {
            return res.status(400).json({ message: 'Người dùng đã là thành viên của nhóm' });
        }

        group.members.push({
            userId: userToAdd._id,
            role: 'member'
        });

        await group.save();

        await createNotification({
            body: {
                title: 'Thêm vào nhóm mới',
                message: `Bạn đã được thêm vào nhóm: ${group.name}`,
                type: 'group',
                recipients: [userId],
                groupId: group._id
            },
            user: req.user
        });

        res.json({ message: 'Đã thêm thành viên thành công' });
    } catch (error) {
        console.error('Lỗi khi thêm thành viên vào nhóm:', error);
        res.status(400).json({ message: 'Có lỗi xảy ra khi thêm thành viên' });
    }
};

exports.getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const query = ['owner', 'leader'].includes(req.user.role)
            ? {
                $or: [
                    { createdById: userId },
                    { 'members.userId': userId }
                ]
            }
            : { 'members.userId': userId };

        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const groups = await Group.find(query)
            .populate('createdById', 'username email')
            .populate('members.userId', 'username email avatar fullName')
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json(groups);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách nhóm:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách nhóm' });
    }
};

exports.getGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;
        
        if (!isValidObjectId(groupId)) {
            return res.status(400).json({ message: 'ID nhóm không hợp lệ' });
        }

        const group = await Group.findById(groupId)
            .populate('createdById', 'username email')
            .populate('members.userId', 'username email avatar');

        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }
        
        const isMember = group.members.some(m => m.userId._id.toString() === userId.toString());
        const isCreator = group.createdById._id.toString() === userId.toString();

        if (!isMember && !isCreator && !['owner', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }

        res.json(group);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin nhóm:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy thông tin nhóm' });
    }
};

exports.removeMemberFromGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        
        if (!isValidObjectId(groupId) || !isValidObjectId(userId)) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }
        
        if (userId === req.user._id.toString() && !['owner', 'admin'].includes(req.user.role)) {
            return res.status(400).json({ message: 'Không thể tự xóa mình khỏi nhóm' });
        }
        
        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }

        const requesterMember = group.members.find(m => m.userId.toString() === req.user._id.toString());
        if (!requesterMember || !['owner', 'leader'].includes(requesterMember.role)) {
            return res.status(403).json({ message: 'Không có quyền xóa thành viên' });
        }

        const memberToRemove = await User.findById(userId).select('_id');
        if (!memberToRemove) {
            return res.status(404).json({ message: 'Không tìm thấy thành viên' });
        }

        const memberInGroup = group.members.find(m => m.userId.toString() === userId);
        if (memberInGroup && memberInGroup.role === 'owner') {
            return res.status(403).json({ message: 'Không thể xóa chủ nhóm' });
        }
        
        if (memberInGroup && memberInGroup.role === 'leader' && requesterMember.role !== 'owner') {
            return res.status(403).json({ message: 'Không đủ quyền để xóa quản lý nhóm' });
        }

        group.members = group.members.filter(member => 
            member.userId.toString() !== userId
        );

        await group.save();

        await createNotification({
            body: {
                title: 'Đã xóa khỏi nhóm',
                message: `Bạn đã bị xóa khỏi nhóm: ${group.name}`,
                type: 'group',
                recipients: [userId],
                groupId: group._id
            },
            user: req.user
        });

        res.json({ message: 'Đã xóa thành viên thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa thành viên khỏi nhóm:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xóa thành viên' });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        if (!isValidObjectId(groupId)) {
            return res.status(400).json({ message: 'ID nhóm không hợp lệ' });
        }
        
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }

        const isCreator = group.createdById.toString() === req.user._id.toString();
        if (!isCreator && !['owner', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Không có quyền xóa nhóm này' });
        }

        const memberIds = group.members
            .map(member => member.userId.toString())
            .filter(id => id !== req.user._id.toString());

        await Group.findByIdAndDelete(groupId);

        if (memberIds.length > 0) {
            await createNotification({
                body: {
                    title: 'Nhóm đã bị xóa',
                    message: `Nhóm "${group.name}" đã bị xóa bởi ${req.user.username}`,
                    type: 'group',
                    recipients: memberIds
                },
                user: req.user
            });
        }

        res.json({ message: 'Đã xóa nhóm thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa nhóm:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xóa nhóm' });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const query = sanitizeInput(req.query.query);
        if (!query || query.trim() === '') {
            return res.status(400).json({ message: 'Cần nhập từ khóa tìm kiếm' });
        }

        const limit = 20;
        
        const queryRegex = new RegExp(query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'i');

        const users = await User.find({
            $or: [
                { username: { $regex: queryRegex } },
                { email: { $regex: queryRegex } }
            ]
        })
        .select('username email avatar')
        .limit(limit)
        .lean();

        res.json(users);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm người dùng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi tìm kiếm người dùng' });
    }
};

exports.updateMemberRole = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const { role } = req.body;

        if (!isValidObjectId(groupId) || !isValidObjectId(userId)) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }

        if (!['member', 'leader'].includes(role)) {
            return res.status(400).json({ message: 'Vai trò không hợp lệ' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }

        const requesterMember = group.members.find(m => m.userId.toString() === req.user._id.toString());
        if (!requesterMember) {
            return res.status(403).json({ message: 'Bạn không phải là thành viên của nhóm' });
        }
        
        if (!['owner', 'leader'].includes(requesterMember.role)) {
            return res.status(403).json({ message: 'Không có quyền cập nhật vai trò thành viên' });
        }

        const memberIndex = group.members.findIndex(m => m.userId.toString() === userId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy thành viên trong nhóm' });
        }

        if (group.members[memberIndex].role === 'owner') {
            return res.status(403).json({ message: 'Không thể thay đổi vai trò của chủ nhóm' });
        }
        
        if (requesterMember.role === 'leader' && role === 'leader') {
            return res.status(403).json({ message: 'Chỉ chủ nhóm mới có thể thêm quản lý' });
        }

        if (requesterMember.role === 'leader' && 
            group.members[memberIndex].role === 'leader') {
            return res.status(403).json({ message: 'Không thể thay đổi vai trò của quản lý khác' });
        }

        group.members[memberIndex].role = role;
        await group.save();

        await createNotification({
            body: {
                title: 'Cập nhật vai trò',
                message: `Vai trò của bạn trong nhóm "${group.name}" đã được cập nhật thành ${role === 'leader' ? 'quản lý' : 'thành viên'}`,
                type: 'group',
                recipients: [userId],
                groupId: group._id
            },
            user: req.user
        });

        res.json({ message: 'Đã cập nhật vai trò thành viên thành công' });
    } catch (error) {
        console.error('Lỗi khi cập nhật vai trò thành viên:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật vai trò thành viên' });
    }
};