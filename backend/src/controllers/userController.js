const User = require('../models/User');
const Friend = require('../models/Friend');
const bcrypt = require('bcryptjs');


const createDiacriticRegex = (str) => {
    
    const diacriticPatterns = {
        'a': '(?:[aàáạảãâầấậẩẫăằắặẳẵ])',
        'e': '(?:[eèéẹẻẽêềếệểễ])',
        'i': '(?:[iìíịỉĩ])',
        'o': '(?:[oòóọỏõôồốộổỗơờớợởỡ])',
        'u': '(?:[uùúụủũưừứựửữ])',
        'y': '(?:[yỳýỵỷỹ])',
        'd': '(?:[dđ])',
        
        'à': '(?:[àa])',
        'á': '(?:[áa])',
        'ạ': '(?:[ạa])',
        'ả': '(?:[ảa])',
        'ã': '(?:[ãa])',
        'â': '(?:[âa])',
        'ầ': '(?:[ầâa])',
        'ấ': '(?:[ấâa])',
        'ậ': '(?:[ậâa])',
        'ẩ': '(?:[ẩâa])',
        'ẫ': '(?:[ẫâa])',
        'ă': '(?:[ăa])',
        'ằ': '(?:[ằăa])',
        'ắ': '(?:[ắăa])',
        'ặ': '(?:[ặăa])',
        'ẳ': '(?:[ẳăa])',
        'ẵ': '(?:[ẵăa])',
        'è': '(?:[èe])',
        'é': '(?:[ée])',
        'ẹ': '(?:[ẹe])',
        'ẻ': '(?:[ẻe])',
        'ẽ': '(?:[ẽe])',
        'ê': '(?:[êe])',
        'ề': '(?:[ềêe])',
        'ế': '(?:[ếêe])',
        'ệ': '(?:[ệêe])',
        'ể': '(?:[ểêe])',
        'ễ': '(?:[ễêe])',
        'ì': '(?:[ìi])',
        'í': '(?:[íi])',
        'ị': '(?:[ịi])',
        'ỉ': '(?:[ỉi])',
        'ĩ': '(?:[ĩi])',
        'ò': '(?:[òo])',
        'ó': '(?:[óo])',
        'ọ': '(?:[ọo])',
        'ỏ': '(?:[ỏo])',
        'õ': '(?:[õo])',
        'ô': '(?:[ôo])',
        'ồ': '(?:[ồôo])',
        'ố': '(?:[ốôo])',
        'ộ': '(?:[ộôo])',
        'ổ': '(?:[ổôo])',
        'ỗ': '(?:[ỗôo])',
        'ơ': '(?:[ơo])',
        'ờ': '(?:[ờơo])',
        'ớ': '(?:[ớơo])',
        'ợ': '(?:[ợơo])',
        'ở': '(?:[ởơo])',
        'ỡ': '(?:[ỡơo])',
        'ù': '(?:[ùu])',
        'ú': '(?:[úu])',
        'ụ': '(?:[ụu])',
        'ủ': '(?:[ủu])',
        'ũ': '(?:[ũu])',
        'ư': '(?:[ưu])',
        'ừ': '(?:[ừưu])',
        'ứ': '(?:[ứưu])',
        'ự': '(?:[ựưu])',
        'ử': '(?:[ửưu])',
        'ữ': '(?:[ữưu])',
        'ỳ': '(?:[ỳy])',
        'ý': '(?:[ýy])',
        'ỵ': '(?:[ỵy])',
        'ỷ': '(?:[ỷy])',
        'ỹ': '(?:[ỹy])',
        'đ': '(?:[đd])'
    };

    
    const pattern = str.split('').map(char => {
        const lowerChar = char.toLowerCase();
        return diacriticPatterns[lowerChar] || char;
    }).join('');

    return new RegExp(pattern, 'i');
};

exports.addUser = async (req, res) => {
    try {
        const { username, email, password, role, fullName, phone, secondaryRole } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            fullName,
            password: hashedPassword,
            phone,
            role,
            secondaryRole
        });

        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json(userResponse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = createDiacriticRegex(query);
        console.log('Search pattern:', searchRegex); 

        
        const users = await User.find({
            $or: [
                { username: searchRegex },
                { email: searchRegex },
                { fullName: searchRegex }
            ]
        }).select('-password');

        console.log(`Found ${users.length} users matching "${query}"`); 
        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const users = await User.find().select('-password');

        
        const friendships = await Friend.find({
            $or: [
                { user: currentUserId },
                { friend: currentUserId }
            ]
        });

        const formattedUsers = users.map(user => {
            if (user._id.toString() === currentUserId.toString()) {
                return null; 
            }

            
            const friendship = friendships.find(f =>
                (f.user.toString() === user._id.toString() && f.friend.toString() === currentUserId.toString()) ||
                (f.friend.toString() === user._id.toString() && f.user.toString() === currentUserId.toString())
            );

            let friendStatus = 'none';
            if (friendship) {
                if (friendship.status === 'accepted') {
                    friendStatus = 'friend';
                } else if (friendship.status === 'pending') {
                    
                    
                    friendStatus = friendship.user.toString() === currentUserId.toString() ? 'pending' : 'received';
                } else if (friendship.status === 'rejected') {
                    
                    let friendStatus = 'none';
                }
            }

            return {
                ...user.toObject(),
                friendStatus
            };
        }).filter(user => user !== null); 

        res.json(formattedUsers);
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTodayBirthdays = async (req, res) => {
    try {
        const today = new Date();
        const users = await User.find({
            dateOfBirth: { 
                $exists: true,
                $ne: null 
            }
        }).select('fullName dateOfBirth avatar');

        const todayBirthdays = users.filter(user => {
            if (!user.dateOfBirth) return false;
            const birthday = new Date(user.dateOfBirth);
            return birthday.getDate() === today.getDate() && 
                   birthday.getMonth() === today.getMonth();
        });

        res.json(todayBirthdays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, email, password, role, fullName, phone, secondaryRole } = req.body;
        const updateData = {
            username,
            email,
            fullName,
            phone,
            role,
            secondaryRole
        };

        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const user = await User.findByIdAndUpdate(
            req.params.id, 
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const {
            phone,
            currentPassword,
            newPassword,
            fullName,
            dateOfBirth,
            gender,
            bio,
            interests,
            location,
            relationshipStatus,
            city,
            province,
            cv
        } = req.body;
        
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (newPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
            }
            
            user.password = await bcrypt.hash(newPassword, 10);
        }

        
        user.phone = phone || user.phone;
        user.fullName = fullName || user.fullName;
        
        
        if (dateOfBirth) {
            const birthDate = new Date(dateOfBirth);
            if (!isNaN(birthDate.getTime())) {
                user.dateOfBirth = birthDate;
            }
        }
        if (gender) user.gender = gender;
        if (bio) user.bio = bio;
        if (interests) user.interests = interests;
        if (city) user.city = city;
        if (province) user.province = province;
        if (relationshipStatus) user.relationshipStatus = relationshipStatus;
        if (cv) user.cv = cv;
        
        if (req.file) {
            
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({ 
                    message: 'Invalid file type. Only JPG, PNG, GIF and WebP images are allowed.' 
                });
            }
            
            
            const maxSize = 5 * 1024 * 1024; 
            if (req.file.size > maxSize) {
                return res.status(400).json({ 
                    message: 'File too large. Maximum size is 5MB.' 
                });
            }
            
            if (user.avatar) {
                const fs = require('fs');
                const path = require('path');
                const oldPath = path.join(__dirname, '..', '..', user.avatar);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            
            user.avatar = req.avatarPath;
        }

        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.json(userResponse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSecondaryRole = async (req, res) => {
    try {
        const { secondaryRole } = req.body;
        if (secondaryRole === undefined) {
            return res.status(400).json({ message: 'Secondary role is required' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { secondaryRole },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getPendingApprovalUsers = async (req, res) => {
    try {
        
        
        const pendingUsers = await User.find({ role: 'demo' })
            .select('username fullName email createdAt approvalStatus interviewDate interviewLocation')
            .sort({ createdAt: -1 });
            console.log('Pending users:', pendingUsers); 
        res.json(pendingUsers);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng chờ duyệt:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi lấy danh sách người dùng chờ duyệt.' });
    }
};

exports.getPendingUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        
        
        const user = await User.findOne({ _id: userId, role: 'demo' });
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng đang chờ duyệt' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin chi tiết người dùng chờ duyệt:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi lấy thông tin chi tiết người dùng.' });
    }
};


exports.updateApprovalStatus = async (req, res) => {
    try {
        const { status, interviewDate, interviewLocation, interviewNotes } = req.body;
        const userId = req.params.id;

        
        const validStatuses = ['pending', 'reviewing', 'interview', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Trạng thái không hợp lệ. Các trạng thái hợp lệ: ' + validStatuses.join(', ')
            });
        }

        
        const updateData = { approvalStatus: status };

        
        if (status === 'interview' && interviewDate) {
            updateData.interviewDate = new Date(interviewDate);
            if (interviewLocation) updateData.interviewLocation = interviewLocation;
            if (interviewNotes) updateData.interviewNotes = interviewNotes;
        }

        
        if (status === 'approved') {
            updateData.role = 'member';
        }

        
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json({ 
            message: 'Cập nhật trạng thái thành công',
            user
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái xét duyệt:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi cập nhật trạng thái.' });
    }
};


exports.getUsersByApprovalStatus = async (req, res) => {
    try {
        const { status } = req.query;

        
        const query = { role: 'demo' };
        if (status) {
            query.approvalStatus = status;
        }

        
        const users = await User.find(query)
            .select('username fullName email createdAt approvalStatus interviewDate interviewLocation')
            .sort({ createdAt: -1 });
        
        res.json(users);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng theo trạng thái:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};


exports.setUserToInterview = async (req, res) => {
    try {
        const userId = req.params.id;
        const { interviewDate, interviewLocation, interviewNotes } = req.body;

        if (!interviewDate) {
            return res.status(400).json({ message: 'Thời gian phỏng vấn là bắt buộc' });
        }

        
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                approvalStatus: 'interview',
                interviewDate: new Date(interviewDate),
                interviewLocation: interviewLocation || '',
                interviewNotes: interviewNotes || ''
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        
        

        res.json({ 
            message: 'Đã lên lịch phỏng vấn thành công',
            user
        });
    } catch (error) {
        console.error('Lỗi khi lên lịch phỏng vấn:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi lên lịch phỏng vấn.' });
    }
};


exports.setUserToInterview = async (req, res) => {
    try {
        const { userId } = req.params;
        const { interviewDate, interviewLocation, interviewNotes } = req.body;
        
        
        if (!interviewDate || !interviewLocation) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ngày và địa điểm phỏng vấn'
            });
        }
        
        
        const user = await User.findByIdAndUpdate(
            userId, 
            {
                approvalStatus: 'interview',
                interviewDate,
                interviewLocation,
                interviewNotes,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        
        
        const notificationText = `Đơn đăng ký của bạn đã được chọn để phỏng vấn vào lúc ${new Date(interviewDate).toLocaleString()} tại ${interviewLocation}`;
        
        
        const notification = new Notification({
            recipient: user._id,
            content: notificationText,
            type: 'interview_scheduled',
            data: {
                interviewDate,
                interviewLocation
            }
        });
        
        await notification.save();
        
        
        if (user.email) {
            
            
        }
        
        return res.status(200).json({
            success: true,
            message: 'Đã lên lịch phỏng vấn thành công',
            data: user
        });
        
    } catch (error) {
        console.error('Error in setUserToInterview:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lên lịch phỏng vấn',
            error: error.message
        });
    }
};


exports.approveUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { 
                role: 'member',
                approvalStatus: 'approved'
            },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        res.json({ message: 'Người dùng đã được phê duyệt thành công', user });
    } catch (error) {
        console.error('Lỗi khi phê duyệt người dùng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi phê duyệt người dùng.' });
    }
};


exports.rejectUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { approvalStatus: 'rejected' },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        res.json({ message: 'Đã từ chối người dùng thành công', user });
    } catch (error) {
        console.error('Lỗi khi từ chối người dùng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi từ chối người dùng.' });
    }
};