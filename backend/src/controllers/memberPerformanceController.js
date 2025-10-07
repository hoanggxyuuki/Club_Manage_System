const User = require('../models/User');
const Event = require('../models/eventSchema');
const Task = require('../models/Task');
const Group = require('../models/Group');
const ActivitySchedule = require('../models/ActivitySchedule');
const MemberPerformance = require('../models/MemberPerformance');
const mongoose = require('mongoose');

const checkPermission = async (userId, requiredRoles = ['admin', 'leader','member']) => {
    const user = await User.findById(userId).select('role');
    if (!user) {
        return false;
    }
    return requiredRoles.includes(user.role);
};

const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.replace(/[<>"'&]/g, '');
    }
    return input;
};

exports.getAllPerformances = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Không được phép truy cập. Vui lòng đăng nhập.' });
        }

        // Kiểm tra quyền truy cập
        const hasPermission = await checkPermission(req.user._id);
        if (!hasPermission && req.user.role !== 'member') {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này.' });
        }

        // Tạo bản sao và làm sạch dữ liệu đầu vào
        const { year, month } = {
            year: sanitizeInput(req.query.year),
            month: sanitizeInput(req.query.month)
        };

        // Xác thực tham số đầu vào
        if (year && (isNaN(year) || year < 2000 || year > 2100)) {
            return res.status(400).json({ message: 'Năm không hợp lệ' });
        }

        if (month && (isNaN(month) || month < 1 || month > 12)) {
            return res.status(400).json({ message: 'Tháng không hợp lệ' });
        }

        const members = await User.find(
            { role: { $in: ['member', 'leader'] } },
            'fullName email avatar'
        );

        if (!members || members.length === 0) {
            return res.json([]);
        }

        const performancePromises = members.map(async (member) => {
            // Kiểm tra ID member có hợp lệ không
            if (!mongoose.Types.ObjectId.isValid(member._id)) {
                return null;
            }
            
            let dateFilter = {};

            if (year && month) {
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0);
                dateFilter = {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                };
            }

            const [events, tasks, meetings, totalMeetings] = await Promise.all([
                Event.find({
                    'participants': {
                        $elemMatch: {
                            'userId': member._id,
                            'status': 'confirmed',
                            'attendance.isPresent': true
                        }
                    },
                    ...dateFilter
                }),
                Task.find({
                    assignedTo: member._id,
                    status: 'completed',
                    ...dateFilter
                }),
                ActivitySchedule.find({
                    'attendees': {
                        $elemMatch: {
                            'userId': member._id,
                            'status': 'attended'
                        }
                    },
                    ...dateFilter
                }),
                ActivitySchedule.countDocuments(dateFilter)
            ]);

            const attendanceRate = totalMeetings > 0 ? (meetings.length / totalMeetings) * 100 : 0;
            const totalScore = (
                events.length * 10 +
                tasks.length * 15 +
                meetings.length * 5
            );

            if (year && month) {
                try {
                    const monthlyData = {
                        year: parseInt(year),
                        month: parseInt(month),
                        metrics: {
                            eventsParticipated: events.map(e => e._id),
                            tasksCompleted: tasks.map(t => t._id),
                            meetingsAttended: meetings.map(m => m._id)
                        },
                        statistics: {
                            eventCount: events.length,
                            taskCount: tasks.length,
                            meetingCount: meetings.length,
                            attendanceRate,
                            totalScore
                        }
                    };

                    let performance = await MemberPerformance.findOne({ member: member._id });

                    if (!performance) {
                        performance = new MemberPerformance({
                            member: member._id,
                            monthlyStatistics: [monthlyData]
                        });
                        await performance.save();
                    } else {
                        const monthIndex = performance.monthlyStatistics.findIndex(
                            ms => ms.year === parseInt(year) && ms.month === parseInt(month)
                        );

                        if (monthIndex === -1) {
                            performance.monthlyStatistics.push(monthlyData);
                        } else {
                            performance.monthlyStatistics[monthIndex] = {
                                ...performance.monthlyStatistics[monthIndex],
                                ...monthlyData
                            };
                        }

                        await performance.save();
                    }
                } catch (error) {
                    console.error('Lỗi cập nhật hiệu suất hàng tháng:', error);
                    throw new Error('Không thể cập nhật hiệu suất hàng tháng');
                }
            }

            return {
                member: {
                    _id: member._id,
                    name: member.fullName,
                    email: member.email,
                    avatar: member.avatar ?
                        member.avatar.replace('/uploads/avatars/uploads/avatars/', 'uploads/avatars/') : null
                },
                period: year && month ? { year: parseInt(year), month: parseInt(month) } : null,
                statistics: {
                    eventCount: events.length,
                    taskCount: tasks.length,
                    meetingCount: meetings.length,
                    attendanceRate
                },
                totalScore
            };
        });

        let performances = await Promise.all(performancePromises);
        
        // Lọc ra các giá trị null nếu có
        performances = performances.filter(p => p !== null);

        performances.sort((a, b) => b.totalScore - a.totalScore);
        performances = performances.map((perf, index) => ({
            ...perf,
            rank: index + 1
        }));

        console.log(`Đã tính toán hiệu suất cho ${performances.length} thành viên`);
        res.json(performances);
    } catch (error) {
        console.error('Lỗi lấy hiệu suất:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
};

exports.getMemberPerformance = async (req, res) => {
    try {
        // Kiểm tra xác thực
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Không được phép truy cập. Vui lòng đăng nhập.' });
        }
        
        // Kiểm tra quyền hạn
        const hasPermission = await checkPermission(req.user._id);
        const isSelfAccess = req.params.memberId === req.user._id.toString();
        
        if (!hasPermission && !isSelfAccess) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này.' });
        }

        const { memberId } = req.params;
        
        // Xác thực ID
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ message: 'ID thành viên không hợp lệ' });
        }

        // Tạo bản sao và làm sạch dữ liệu đầu vào
        const { year, month } = {
            year: sanitizeInput(req.query.year),
            month: sanitizeInput(req.query.month)
        };

        // Xác thực tham số đầu vào
        if (year && (isNaN(year) || year < 2000 || year > 2100)) {
            return res.status(400).json({ message: 'Năm không hợp lệ' });
        }

        if (month && (isNaN(month) || month < 1 || month > 12)) {
            return res.status(400).json({ message: 'Tháng không hợp lệ' });
        }

        // Check if memberId is valid
        const member = await User.findById(memberId, 'fullName email avatar');
        if (!member) {
            return res.status(404).json({ message: 'Thành viên không tồn tại' });
        }

        // Create date filters if year and month are provided
        let dateFilter = {};
        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            dateFilter = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            };
        }

        // Get all necessary data in parallel
        const [events, tasks, meetings, totalMeetings, allMemberPerformances] = await Promise.all([
            // Get events where member participated and attended
            Event.find({
                'participants': {
                    $elemMatch: {
                        'userId': memberId,
                        'status': 'confirmed',
                        'attendance.isPresent': true
                    }
                },
                ...dateFilter
            }),
            
            // Get tasks completed by member
            Task.find({
                assignedTo: memberId,
                status: 'completed',
                ...dateFilter
            }),
            
            // Get meetings attended by member
            ActivitySchedule.find({
                'attendees': {
                    $elemMatch: {
                        'userId': memberId,
                        'status': 'attended'
                    }
                },
                ...dateFilter
            }),
            
            // Get total number of meetings (for attendance rate)
            ActivitySchedule.countDocuments(dateFilter),
            
            // Calculate performances for all members (to determine rank)
            this.getAllPerformances({ query: { year, month }, user: req.user })
                .then(response => response && Array.isArray(response) ? response : [])
                .catch(() => [])
        ]);

        // Calculate statistics
        const attendanceRate = totalMeetings > 0 ? (meetings.length / totalMeetings) * 100 : 0;
        const totalScore = (
            events.length * 10 +
            tasks.length * 15 +
            meetings.length * 5
        );

        // Find rank among all members
        let rank = 1;
        if (allMemberPerformances && allMemberPerformances.length) {
            const memberPerf = allMemberPerformances.find(p => p.member._id.toString() === memberId);
            rank = memberPerf ? memberPerf.rank : allMemberPerformances.length + 1;
        }

        // Create response object
        const performance = {
            member: {
                _id: member._id,
                name: member.fullName,
                email: member.email,
                avatar: member.avatar ? 
                    member.avatar.replace('/uploads/avatars/uploads/avatars/', 'uploads/avatars/') : null
            },
            period: year && month ? { 
                year: parseInt(year), 
                month: parseInt(month) 
            } : null,
            statistics: {
                eventCount: events.length,
                taskCount: tasks.length,
                meetingCount: meetings.length,
                attendanceRate
            },
            metrics: {
                eventsParticipated: events,
                tasksCompleted: tasks,
                meetingsAttended: meetings
            },
            totalScore,
            rank,
            lastUpdated: new Date()
        };

        res.json(performance);
    } catch (error) {
        console.error('Lỗi lấy hiệu suất thành viên:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
};

exports.getMemberMonthlyPerformance = async (req, res) => {
    try {
        // Kiểm tra xác thực
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Không được phép truy cập. Vui lòng đăng nhập.' });
        }
        
        // Kiểm tra quyền hạn
        const hasPermission = await checkPermission(req.user._id);
        const isSelfAccess = req.params.memberId === req.user._id.toString();
        
        if (!hasPermission && !isSelfAccess) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này.' });
        }

        const { memberId } = req.params;
        
        // Xác thực ID
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ message: 'ID thành viên không hợp lệ' });
        }

        const performance = await MemberPerformance.findOne({ member: memberId })
            .populate('monthlyStatistics.metrics.eventsParticipated')
            .populate('monthlyStatistics.metrics.tasksCompleted')
            .populate('monthlyStatistics.metrics.meetingsAttended');

        if (!performance) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu hiệu suất' });
        }

        res.json(performance.monthlyStatistics);
    } catch (error) {
        console.error('Lỗi lấy hiệu suất hàng tháng:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
};

// Thêm middleware kiểm tra rate limiting
exports.checkRateLimit = async (req, res, next) => {
    try {
        // Thực hiện kiểm tra rate limit ở đây nếu cần
        // ...
        
        // Chuyển qua middleware tiếp theo nếu hợp lệ
        next();
    } catch (error) {
        res.status(429).json({ message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });
    }
};