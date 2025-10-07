const User = require('../models/User');
const Member = require('../models/Member');
const Group = require('../models/Group');
const Task = require('../models/Task');
const Event = require('../models/eventSchema');
const Evidence = require('../models/evidence');
const Notification = require('../models/notification');
const Forum = require('../models/forum');
const Post = require('../models/Post');
const Chat = require('../models/Chat');
const Friend = require('../models/Friend');
const Match = require('../models/Match');
const MemberPerformance = require('../models/MemberPerformance');
const ActivitySchedule = require('../models/ActivitySchedule');
const Achievement = require('../models/Achievement');
const Competition = require('../models/Competition');
const ClubNews = require('../models/ClubNews');
const DemoNotification = require('../models/DemoNotification');
const SystemConfig = require('../models/SystemConfig');
const BankModel = require('../models/bankModel');
const AnonymousMail = require('../models/anonymous_mail');
const BlacklistedUrl = require('../models/BlacklistedUrl');
const BlockedIp = require('../models/blocked_ip');
const ProxyUrl = require('../models/ProxyUrl');
const UploadTracking = require('../models/UploadTracking');
const UserUrlPreviewSettings = require('../models/UserUrlPreviewSettings');

// Lấy toàn bộ dữ liệu từ database
exports.getAllData = async (req, res) => {
    try {
        const data = {};

        // Lấy dữ liệu từ tất cả các collection
        data.users = await User.find().lean();
        data.members = await Member.find().lean();
        data.groups = await Group.find().lean();
        data.tasks = await Task.find().lean();
        data.events = await Event.find().lean();
        data.evidences = await Evidence.find().lean();
        data.notifications = await Notification.find().lean();
        data.forums = await Forum.find().lean();
        data.posts = await Post.find().lean();
        data.chats = await Chat.find().lean();
        data.friends = await Friend.find().lean();
        data.matches = await Match.find().lean();
        data.memberPerformances = await MemberPerformance.find().lean();
        data.activitySchedules = await ActivitySchedule.find().lean();
        data.achievements = await Achievement.find().lean();
        data.competitions = await Competition.find().lean();
        data.clubNews = await ClubNews.find().lean();
        data.demoNotifications = await DemoNotification.find().lean();
        data.systemConfigs = await SystemConfig.find().lean();
        data.bankData = await BankModel.find().lean();
        data.anonymousMails = await AnonymousMail.find().lean();
        data.blacklistedUrls = await BlacklistedUrl.find().lean();
        data.blockedIps = await BlockedIp.find().lean();
        data.proxyUrls = await ProxyUrl.find().lean();
        data.uploadTrackings = await UploadTracking.find().lean();
        data.userUrlPreviewSettings = await UserUrlPreviewSettings.find().lean();

        // Thêm thống kê tổng quan
        const stats = {
            totalUsers: data.users.length,
            totalMembers: data.members.length,
            totalGroups: data.groups.length,
            totalTasks: data.tasks.length,
            totalEvents: data.events.length,
            totalEvidences: data.evidences.length,
            totalNotifications: data.notifications.length,
            totalForums: data.forums.length,
            totalPosts: data.posts.length,
            totalChats: data.chats.length,
            totalFriends: data.friends.length,
            totalMatches: data.matches.length,
            totalMemberPerformances: data.memberPerformances.length,
            totalActivitySchedules: data.activitySchedules.length,
            totalAchievements: data.achievements.length,
            totalCompetitions: data.competitions.length,
            totalClubNews: data.clubNews.length,
            totalDemoNotifications: data.demoNotifications.length,
            totalSystemConfigs: data.systemConfigs.length,
            totalBankData: data.bankData.length,
            totalAnonymousMails: data.anonymousMails.length,
            totalBlacklistedUrls: data.blacklistedUrls.length,
            totalBlockedIps: data.blockedIps.length,
            totalProxyUrls: data.proxyUrls.length,
            totalUploadTrackings: data.uploadTrackings.length,
            totalUserUrlPreviewSettings: data.userUrlPreviewSettings.length,
            dataExportedAt: new Date()
        };

        res.json({
            success: true,
            message: 'Lấy toàn bộ dữ liệu thành công',
            stats: stats,
            data: data
        });

    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy dữ liệu',
            error: error.message
        });
    }
};

// Lấy dữ liệu theo collection cụ thể
exports.getDataByCollection = async (req, res) => {
    try {
        const { collection } = req.params;
        let data;

        switch (collection.toLowerCase()) {
            case 'users':
                data = await User.find().lean();
                break;
            case 'members':
                data = await Member.find().lean();
                break;
            case 'groups':
                data = await Group.find().lean();
                break;
            case 'tasks':
                data = await Task.find().lean();
                break;
            case 'events':
                data = await Event.find().lean();
                break;
            case 'evidences':
                data = await Evidence.find().lean();
                break;
            case 'notifications':
                data = await Notification.find().lean();
                break;
            case 'forums':
                data = await Forum.find().lean();
                break;
            case 'posts':
                data = await Post.find().lean();
                break;
            case 'chats':
                data = await Chat.find().lean();
                break;
            case 'friends':
                data = await Friend.find().lean();
                break;
            case 'matches':
                data = await Match.find().lean();
                break;
            case 'memberperformances':
                data = await MemberPerformance.find().lean();
                break;
            case 'activityschedules':
                data = await ActivitySchedule.find().lean();
                break;
            case 'achievements':
                data = await Achievement.find().lean();
                break;
            case 'competitions':
                data = await Competition.find().lean();
                break;
            case 'clubnews':
                data = await ClubNews.find().lean();
                break;
            case 'demonotifications':
                data = await DemoNotification.find().lean();
                break;
            case 'systemconfigs':
                data = await SystemConfig.find().lean();
                break;
            case 'bankdata':
                data = await BankModel.find().lean();
                break;
            case 'anonymousmails':
                data = await AnonymousMail.find().lean();
                break;
            case 'blacklistedurls':
                data = await BlacklistedUrl.find().lean();
                break;
            case 'blockedips':
                data = await BlockedIp.find().lean();
                break;
            case 'proxyurls':
                data = await ProxyUrl.find().lean();
                break;
            case 'uploadtrackings':
                data = await UploadTracking.find().lean();
                break;
            case 'usurlpreviewsettings':
                data = await UserUrlPreviewSettings.find().lean();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Collection không hợp lệ'
                });
        }

        res.json({
            success: true,
            message: `Lấy dữ liệu ${collection} thành công`,
            count: data.length,
            data: data
        });

    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu collection:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy dữ liệu collection',
            error: error.message
        });
    }
};

// Lấy thống kê tổng quan
exports.getStats = async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            totalMembers: await Member.countDocuments(),
            totalGroups: await Group.countDocuments(),
            totalTasks: await Task.countDocuments(),
            totalEvents: await Event.countDocuments(),
            totalEvidences: await Evidence.countDocuments(),
            totalNotifications: await Notification.countDocuments(),
            totalForums: await Forum.countDocuments(),
            totalPosts: await Post.countDocuments(),
            totalChats: await Chat.countDocuments(),
            totalFriends: await Friend.countDocuments(),
            totalMatches: await Match.countDocuments(),
            totalMemberPerformances: await MemberPerformance.countDocuments(),
            totalActivitySchedules: await ActivitySchedule.countDocuments(),
            totalAchievements: await Achievement.countDocuments(),
            totalCompetitions: await Competition.countDocuments(),
            totalClubNews: await ClubNews.countDocuments(),
            totalDemoNotifications: await DemoNotification.countDocuments(),
            totalSystemConfigs: await SystemConfig.countDocuments(),
            totalBankData: await BankModel.countDocuments(),
            totalAnonymousMails: await AnonymousMail.countDocuments(),
            totalBlacklistedUrls: await BlacklistedUrl.countDocuments(),
            totalBlockedIps: await BlockedIp.countDocuments(),
            totalProxyUrls: await ProxyUrl.countDocuments(),
            totalUploadTrackings: await UploadTracking.countDocuments(),
            totalUserUrlPreviewSettings: await UserUrlPreviewSettings.countDocuments(),
            lastUpdated: new Date()
        };

        res.json({
            success: true,
            message: 'Lấy thống kê thành công',
            stats: stats
        });

    } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê',
            error: error.message
        });
    }
};

// Lấy dữ liệu theo bảng với phân trang và tìm kiếm
exports.getTableData = async (req, res) => {
    try {
        const { tableName } = req.params;
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            filters = {}
        } = req.query;

        // Map table names to models
        const modelMap = {
            users: User,
            members: Member,
            groups: Group,
            tasks: Task,
            events: Event,
            evidences: Evidence,
            notifications: Notification,
            forums: Forum,
            posts: Post,
            chats: Chat,
            friends: Friend,
            matches: Match,
            memberPerformances: MemberPerformance,
            activitySchedules: ActivitySchedule,
            achievements: Achievement,
            competitions: Competition,
            clubNews: ClubNews,
            demoNotifications: DemoNotification,
            systemConfigs: SystemConfig,
            bankData: BankModel,
            anonymousMails: AnonymousMail,
            blacklistedUrls: BlacklistedUrl,
            blockedIps: BlockedIp,
            proxyUrls: ProxyUrl,
            uploadTracking: UploadTracking,
            userUrlPreviewSettings: UserUrlPreviewSettings
        };

        const Model = modelMap[tableName];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: 'Bảng không tồn tại'
            });
        }

        // Build search query
        let searchQuery = {};
        if (search) {
            const searchFields = Object.keys(Model.schema.paths).filter(field => 
                Model.schema.paths[field].instance === 'String'
            );
            
            searchQuery = {
                $or: searchFields.map(field => ({
                    [field]: { $regex: search, $options: 'i' }
                }))
            };
        }

        // Apply additional filters
        if (filters && Object.keys(filters).length > 0) {
            Object.assign(searchQuery, filters);
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute queries
        const [data, total] = await Promise.all([
            Model.find(searchQuery)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Model.countDocuments(searchQuery)
        ]);

        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Error fetching table data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu bảng',
            error: error.message
        });
    }
};

// Lấy chi tiết một bản ghi
exports.getRecordDetail = async (req, res) => {
    try {
        const { tableName, id } = req.params;

        const modelMap = {
            users: User,
            members: Member,
            groups: Group,
            tasks: Task,
            events: Event,
            evidences: Evidence,
            notifications: Notification,
            forums: Forum,
            posts: Post,
            chats: Chat,
            friends: Friend,
            matches: Match,
            memberPerformances: MemberPerformance,
            activitySchedules: ActivitySchedule,
            achievements: Achievement,
            competitions: Competition,
            clubNews: ClubNews,
            demoNotifications: DemoNotification,
            systemConfigs: SystemConfig,
            bankData: BankModel,
            anonymousMails: AnonymousMail,
            blacklistedUrls: BlacklistedUrl,
            blockedIps: BlockedIp,
            proxyUrls: ProxyUrl,
            uploadTracking: UploadTracking,
            userUrlPreviewSettings: UserUrlPreviewSettings
        };

        const Model = modelMap[tableName];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: 'Bảng không tồn tại'
            });
        }

        const record = await Model.findById(id).lean();
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi'
            });
        }

        res.json({
            success: true,
            data: record
        });

    } catch (error) {
        console.error('Error fetching record detail:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết bản ghi',
            error: error.message
        });
    }
};

// Cập nhật bản ghi
exports.updateRecord = async (req, res) => {
    try {
        const { tableName, id } = req.params;
        const updateData = req.body;

        const modelMap = {
            users: User,
            members: Member,
            groups: Group,
            tasks: Task,
            events: Event,
            evidences: Evidence,
            notifications: Notification,
            forums: Forum,
            posts: Post,
            chats: Chat,
            friends: Friend,
            matches: Match,
            memberPerformances: MemberPerformance,
            activitySchedules: ActivitySchedule,
            achievements: Achievement,
            competitions: Competition,
            clubNews: ClubNews,
            demoNotifications: DemoNotification,
            systemConfigs: SystemConfig,
            bankData: BankModel,
            anonymousMails: AnonymousMail,
            blacklistedUrls: BlacklistedUrl,
            blockedIps: BlockedIp,
            proxyUrls: ProxyUrl,
            uploadTracking: UploadTracking,
            userUrlPreviewSettings: UserUrlPreviewSettings
        };

        const Model = modelMap[tableName];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: 'Bảng không tồn tại'
            });
        }

        // Remove sensitive fields that shouldn't be updated directly
        if (tableName === 'users') {
            delete updateData.password;
            delete updateData.role;
        }

        // Add updatedAt timestamp
        updateData.updatedAt = new Date();

        const updatedRecord = await Model.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi để cập nhật'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật thành công',
            data: updatedRecord
        });

    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật bản ghi',
            error: error.message
        });
    }
};

// Xóa bản ghi
exports.deleteRecord = async (req, res) => {
    try {
        const { tableName, id } = req.params;

        const modelMap = {
            users: User,
            members: Member,
            groups: Group,
            tasks: Task,
            events: Event,
            evidences: Evidence,
            notifications: Notification,
            forums: Forum,
            posts: Post,
            chats: Chat,
            friends: Friend,
            matches: Match,
            memberPerformances: MemberPerformance,
            activitySchedules: ActivitySchedule,
            achievements: Achievement,
            competitions: Competition,
            clubNews: ClubNews,
            demoNotifications: DemoNotification,
            systemConfigs: SystemConfig,
            bankData: BankModel,
            anonymousMails: AnonymousMail,
            blacklistedUrls: BlacklistedUrl,
            blockedIps: BlockedIp,
            proxyUrls: ProxyUrl,
            uploadTracking: UploadTracking,
            userUrlPreviewSettings: UserUrlPreviewSettings
        };

        const Model = modelMap[tableName];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: 'Bảng không tồn tại'
            });
        }

        // Check if record exists
        const record = await Model.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi để xóa'
            });
        }

        // Prevent deletion of certain critical records
        if (tableName === 'users' && record.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không thể xóa tài khoản admin'
            });
        }

        await Model.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa thành công'
        });

    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bản ghi',
            error: error.message
        });
    }
};

// Tạo bản ghi mới
exports.createRecord = async (req, res) => {
    try {
        const { tableName } = req.params;
        const newData = req.body;

        const modelMap = {
            users: User,
            members: Member,
            groups: Group,
            tasks: Task,
            events: Event,
            evidences: Evidence,
            notifications: Notification,
            forums: Forum,
            posts: Post,
            chats: Chat,
            friends: Friend,
            matches: Match,
            memberPerformances: MemberPerformance,
            activitySchedules: ActivitySchedule,
            achievements: Achievement,
            competitions: Competition,
            clubNews: ClubNews,
            demoNotifications: DemoNotification,
            systemConfigs: SystemConfig,
            bankData: BankModel,
            anonymousMails: AnonymousMail,
            blacklistedUrls: BlacklistedUrl,
            blockedIps: BlockedIp,
            proxyUrls: ProxyUrl,
            uploadTracking: UploadTracking,
            userUrlPreviewSettings: UserUrlPreviewSettings
        };

        const Model = modelMap[tableName];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: 'Bảng không tồn tại'
            });
        }

        const newRecord = new Model(newData);
        const savedRecord = await newRecord.save();

        res.status(201).json({
            success: true,
            message: 'Tạo mới thành công',
            data: savedRecord
        });

    } catch (error) {
        console.error('Error creating record:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo bản ghi mới',
            error: error.message
        });
    }
};

// Thống kê nâng cao
exports.getAdvancedStats = async (req, res) => {
    try {
        const { tableName, timeRange = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3m':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const stats = {};

        if (!tableName || tableName === 'users') {
            // User statistics
            const userStats = await User.aggregate([
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        byRole: [
                            { $group: { _id: "$role", count: { $sum: 1 } } }
                        ],
                        recent: [
                            { $match: { createdAt: { $gte: startDate } } },
                            { $count: "count" }
                        ],
                        active: [
                            { $match: { isActive: true } },
                            { $count: "count" }
                        ]
                    }
                }
            ]);

            stats.users = {
                total: userStats[0].total[0]?.count || 0,
                byRole: userStats[0].byRole,
                recent: userStats[0].recent[0]?.count || 0,
                active: userStats[0].active[0]?.count || 0
            };
        }

        if (!tableName || tableName === 'events') {
            // Event statistics
            const eventStats = await Event.aggregate([
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        byStatus: [
                            { $group: { _id: "$status", count: { $sum: 1 } } }
                        ],
                        upcoming: [
                            { $match: { startDate: { $gte: now } } },
                            { $count: "count" }
                        ],
                        thisMonth: [
                            { $match: { createdAt: { $gte: startDate } } },
                            { $count: "count" }
                        ]
                    }
                }
            ]);

            stats.events = {
                total: eventStats[0].total[0]?.count || 0,
                byStatus: eventStats[0].byStatus,
                upcoming: eventStats[0].upcoming[0]?.count || 0,
                thisMonth: eventStats[0].thisMonth[0]?.count || 0
            };
        }

        // Add more table-specific stats as needed...

        res.json({
            success: true,
            stats,
            timeRange,
            generatedAt: now
        });

    } catch (error) {
        console.error('Error getting advanced stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê nâng cao',
            error: error.message
        });
    }
};
