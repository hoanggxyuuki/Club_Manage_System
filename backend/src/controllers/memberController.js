const Member = require('../models/Member');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const PHONE_REGEX = /^(\+\d{1,3}[- ]?)?\d{10,12}$/;


const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};


const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};


exports.addMember = async (req, res) => {
    try {
        const { name, email, password, memberType, status, phone } = req.body;

        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);
        const sanitizedPhone = phone ? sanitizeInput(phone) : undefined;
        
        
        if (!EMAIL_REGEX.test(sanitizedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character' 
            });
        }
        
        
        if (sanitizedPhone && !PHONE_REGEX.test(sanitizedPhone)) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }
        
        
        const existingMember = await Member.findOne({ 
            email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') } 
        });
        
        if (existingMember) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        
        const existingUser = await User.findOne({ 
            email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') } 
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists in user database' });
        }

        
        const hashedPassword = await bcrypt.hash(password, 12);

        
        const member = new Member({
            name: sanitizedName,
            email: sanitizedEmail.toLowerCase(), 
            password: hashedPassword,
            memberType: memberType || 'standard', 
            status: status || 'active', 
            phone: sanitizedPhone,
            lastPasswordChange: new Date()
        });

        await member.save();
        
        
        const memberResponse = member.toObject();
        delete memberResponse.password;
        
        res.status(201).json(memberResponse);
    } catch (error) {
        console.error('Add member error:', error);
        
        
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ 
                message: 'Validation failed',
                errors 
            });
        }
        
        res.status(500).json({ message: 'Failed to add member. Please try again later.' });
    }
};


exports.getMembers = async (req, res) => {
    try {
        
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        
        
        const filter = {};
        if (req.query.status) filter.status = sanitizeInput(req.query.status);
        if (req.query.memberType) filter.memberType = sanitizeInput(req.query.memberType);
        
        
        const total = await Member.countDocuments(filter);

        
        const members = await Member.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            members,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ message: 'Failed to retrieve members' });
    }
};


exports.getMemberById = async (req, res) => {
    try {
        const { id } = req.params;
        
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid member ID format' });
        }
        
        const member = await Member.findById(id).select('-password');
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        
        res.status(200).json(member);
    } catch (error) {
        console.error('Get member error:', error);
        res.status(500).json({ message: 'Failed to retrieve member information' });
    }
};


exports.updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, memberType, status, phone, password } = req.body;
        
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid member ID format' });
        }

        
        const member = await Member.findById(id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        
        const updateData = {};
        
        if (name) updateData.name = sanitizeInput(name);
        
        if (email) {
            const sanitizedEmail = sanitizeInput(email).toLowerCase();
            
            
            if (!EMAIL_REGEX.test(sanitizedEmail)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            
            
            if (sanitizedEmail !== member.email) {
                const existingMember = await Member.findOne({ 
                    email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') },
                    _id: { $ne: id } 
                });
                
                if (existingMember) {
                    return res.status(400).json({ message: 'Email already exists' });
                }
                
                
                const existingUser = await User.findOne({ 
                    email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') } 
                });
                
                if (existingUser) {
                    return res.status(400).json({ message: 'Email already exists in user database' });
                }
            }
            
            updateData.email = sanitizedEmail;
        }
        
        if (memberType) updateData.memberType = sanitizeInput(memberType);
        if (status) updateData.status = sanitizeInput(status);
        
        if (phone) {
            const sanitizedPhone = sanitizeInput(phone);
            
            
            if (!PHONE_REGEX.test(sanitizedPhone)) {
                return res.status(400).json({ message: 'Invalid phone number format' });
            }
            
            updateData.phone = sanitizedPhone;
        }

        
        if (password) {
            
            if (!PASSWORD_REGEX.test(password)) {
                return res.status(400).json({ 
                    message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character' 
                });
            }
            
            
            const isSamePassword = await bcrypt.compare(password, member.password);
            if (isSamePassword) {
                return res.status(400).json({ 
                    message: 'New password must be different from the current password' 
                });
            }
            
            updateData.password = await bcrypt.hash(password, 12);
            updateData.lastPasswordChange = new Date();
        }

        
        const updatedMember = await Member.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json(updatedMember);
    } catch (error) {
        console.error('Update member error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ 
                message: 'Invalid member data',
                errors 
            });
        }
        
        res.status(500).json({ message: 'Failed to update member information' });
    }
};


exports.deleteMember = async (req, res) => {
    try {
        const { id } = req.params;
        
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid member ID format' });
        }
        
        if (!id) {
            return res.status(400).json({ message: 'Member ID is required' });
        }

        
        const member = await Member.findById(id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        
        
        
        
        console.log(`Member deleted: ${member.email} (${id}) by user: ${req.user._id}`);
        
        
        await Member.findByIdAndDelete(id);
        
        res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error('Delete member error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid member ID format' });
        }
        
        res.status(500).json({ message: 'Failed to delete member' });
    }
};


exports.getAllMembers = async (req, res) => {
    try {
        
        const currentUserId = req.user._id;
        
        
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        
        
        const filter = {};
        
        
        if (req.query.search) {
            const sanitizedSearch = sanitizeInput(req.query.search);
            if (sanitizedSearch.length > 0) {
                
                const searchPattern = new RegExp(sanitizedSearch, 'i');
                filter.$or = [
                    { fullName: searchPattern },
                    { email: searchPattern }
                ];
            }
        }
        
        
        const members = await User.find(filter)
            .select('fullName email role secondaryRole avatar')
            .sort({ fullName: 1 })
            .skip(skip)
            .limit(limit);
            
        
        const total = await User.countDocuments(filter);

        
        const Friend = require('../models/Friend');
        const friendships = await Friend.find({
            $or: [
                { user: currentUserId },
                { friend: currentUserId }
            ]
        });

        
        const formattedMembers = members
            .filter(member => member._id.toString() !== currentUserId.toString()) 
            .map(member => {
                
                const friendship = friendships.find(f =>
                    (f.user.toString() === member._id.toString() && f.friend.toString() === currentUserId.toString()) ||
                    (f.friend.toString() === member._id.toString() && f.user.toString() === currentUserId.toString())
                );

                let friendStatus = 'none';
                if (friendship) {
                    if (friendship.status === 'accepted') {
                        friendStatus = 'friend';
                    } else if (friendship.status === 'pending') {
                        
                        
                        friendStatus = friendship.user.toString() === currentUserId.toString() ? 'pending' : 'received';
                    } else if (friendship.status === 'rejected') {
                        friendStatus = 'none';
                    }
                }

                return {
                    _id: member._id,
                    fullName: member.fullName,
                    email: member.email,
                    role: member.role,
                    secondaryRole: member.secondaryRole,
                    avatar: member.avatar,
                    friendStatus
                };
            });

        res.json({
            members: formattedMembers,
            pagination: {
                total: total - 1, 
                page,
                pages: Math.ceil((total - 1) / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error in getAllMembers:', error);
        res.status(500).json({ message: 'Failed to retrieve members' });
    }
};


const memberOperationLimits = new Map();
const OPERATION_WINDOW = 60 * 60 * 1000; 
const OPERATION_LIMIT = 50; 


const checkOperationRateLimit = (userId) => {
    const now = Date.now();
    const key = `member-ops-${userId}`;
    const userActivity = memberOperationLimits.get(key) || { count: 0, timestamp: now };
    
    
    if (now - userActivity.timestamp > OPERATION_WINDOW) {
        userActivity.count = 1;
        userActivity.timestamp = now;
        memberOperationLimits.set(key, userActivity);
        return { limited: false };
    }
    
    
    if (userActivity.count >= OPERATION_LIMIT) {
        return { 
            limited: true, 
            remainingTime: Math.ceil((OPERATION_WINDOW - (now - userActivity.timestamp)) / 60000) 
        };
    }
    
    
    userActivity.count += 1;
    memberOperationLimits.set(key, userActivity);
    return { limited: false };
};


setInterval(() => {
    const now = Date.now();
    memberOperationLimits.forEach((data, key) => {
        if (now - data.timestamp > OPERATION_WINDOW * 2) {
            memberOperationLimits.delete(key);
        }
    });
}, 60 * 60 * 1000); 