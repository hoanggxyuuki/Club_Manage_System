const SystemConfigEntry = require('../models/SystemConfig'); 
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const hybridCache = require('../utils/redisCache');
const databaseOptimizer = require('../utils/databaseOptimizer');




exports.getAllConfigs = async (req, res) => {
    try {
        
        const registrationSettingName = 'allowUserRegistration';
        let registrationSetting = await SystemConfigEntry.findOne({ settingName: registrationSettingName });

        if (!registrationSetting) {
            registrationSetting = await SystemConfigEntry.updateSetting(
                registrationSettingName,
                false, 
                null,  
                'Controls if new user registrations are open or closed. This will show/hide the registration form on the login page.',
                'boolean' 
            );
            console.log(`Default setting "${registrationSettingName}" created.`);
        }

        const configs = await SystemConfigEntry.find().populate('lastUpdatedBy', 'username');
        res.status(200).json(configs);
    } catch (error) {
        console.error('Error getting all system configurations:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách cấu hình hệ thống' });
    }
};


exports.updateConfigById = async (req, res) => {
    try {
        const { id } = req.params;
        const { settingValue } = req.body; 

        if (settingValue === undefined) {
            return res.status(400).json({ message: 'Giá trị cấu hình (settingValue) là bắt buộc' });
        }

        const config = await SystemConfigEntry.findById(id);
        if (!config) {
            return res.status(404).json({ message: 'Không tìm thấy cấu hình' });
        }

        
        let finalValue = settingValue;
        switch (config.type) {
            case 'boolean':
                if (typeof settingValue !== 'boolean' && typeof settingValue !== 'string') {
                    return res.status(400).json({ message: `Giá trị cho ${config.settingName} phải là boolean hoặc chuỗi ('true', 'false').` });
                }
                finalValue = typeof settingValue === 'string' ? settingValue.toLowerCase() === 'true' : Boolean(settingValue);
                break;
            case 'number':
                const numValue = Number(settingValue);
                if (isNaN(numValue)) {
                    return res.status(400).json({ message: `Giá trị cho ${config.settingName} phải là một số.` });
                }
                finalValue = numValue;
                break;
            case 'json':
                try {
                    finalValue = typeof settingValue === 'string' ? JSON.parse(settingValue) : settingValue;
                } catch (e) {
                    return res.status(400).json({ message: `Giá trị cho ${config.settingName} phải là một chuỗi JSON hợp lệ.` });
                }
                break;
            
        }

        config.settingValue = finalValue;
        config.lastUpdatedBy = req.user._id;
        
        await config.save();
        
        const populatedConfig = await SystemConfigEntry.findById(config._id).populate('lastUpdatedBy', 'username');

        res.status(200).json({
            message: `Cấu hình "${config.settingName}" đã được cập nhật thành công`,
            config: populatedConfig
        });
    } catch (error) {
        console.error('Error updating system configuration:', error);
        res.status(500).json({ message: 'Không thể cập nhật cấu hình hệ thống' });
    }
};



exports.getRegistrationStatus = async (req, res) => {
    try {
        const registrationSetting = await SystemConfigEntry.findOne({ settingName: 'allowUserRegistration' });
        
        
        
        

        
        const registrationEnabled = registrationSetting ? Boolean(registrationSetting.settingValue) : false;
        
        
        res.status(200).json({
            registrationEnabled: registrationEnabled,
            
        });
    } catch (error) {
        console.error('Error getting registration status:', error);
        res.status(500).json({ message: 'Không thể lấy trạng thái đăng ký' });
    }
};


exports.updateRegistrationStatus = async (req, res) => {
    try {
        const { registrationEnabled, registrationMessage } = req.body;
        
        if (typeof registrationEnabled !== 'boolean') {
            return res.status(400).json({ message: 'registrationEnabled phải là giá trị boolean' });
        }
        
        
        
        
        
        
        
        

        const updatedEnabledSetting = await SystemConfigEntry.updateSetting(
            'registrationEnabled',
            registrationEnabled,
            'boolean',
            'Controls whether new user registrations are open or closed.',
            req.user._id
        );

        let updatedMessageSetting;
        if (registrationMessage !== undefined) { 
            updatedMessageSetting = await SystemConfigEntry.updateSetting(
                'registrationMessage',
                registrationMessage,
                'text',
                'Message displayed to users regarding registration status.',
                req.user._id
            );
        }
        
        res.status(200).json({
            message: `Đăng ký thành viên mới đã được ${registrationEnabled ? 'bật' : 'tắt'}`,
            config: {
                registrationEnabled: updatedEnabledSetting.settingValue,
                registrationMessage: updatedMessageSetting ? updatedMessageSetting.settingValue : (await SystemConfigEntry.getSetting('registrationMessage'))?.settingValue
            }
        });
    } catch (error) {
        console.error('Error updating registration status:', error);
        res.status(500).json({ message: 'Không thể cập nhật trạng thái đăng ký' });
    }
};


exports.getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'demo' })
            .select('username email fullName createdAt')
            .sort({ createdAt: -1 });
            
        res.status(200).json(users);
    } catch (error) {
        console.error('Error getting pending users:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách người dùng đang chờ duyệt' });
    }
};


exports.approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        if (user.role !== 'demo') {
            return res.status(400).json({ message: 'Người dùng này không trong trạng thái chờ duyệt' });
        }
        
        user.role = 'member';
        await user.save();
        
        
        await createNotification({
            body: {
                title: 'Tài khoản của bạn đã được duyệt',
                message: 'Bạn đã được chấp nhận là thành viên chính thức của câu lạc bộ',
                type: 'user',
                recipients: [userId]
            },
            user: req.user
        });
        
        res.status(200).json({ 
            message: 'Đã duyệt người dùng thành công',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Không thể duyệt người dùng' });
    }
};


exports.rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        if (user.role !== 'demo') {
            return res.status(400).json({ message: 'Người dùng này không trong trạng thái chờ duyệt' });
        }
        
        await User.findByIdAndDelete(userId);
        
        res.status(200).json({ message: 'Đã từ chối và xóa người dùng thành công' });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ message: 'Không thể từ chối người dùng' });
    }
};

// Get performance metrics
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const [cacheStats, dbStats] = await Promise.all([
      hybridCache.getStats(),
      databaseOptimizer.getIndexStats()
    ]);

    // Get system memory usage
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      cache: cacheStats,
      database: dbStats,
      system: {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024) // MB
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000), // ms
          system: Math.round(cpuUsage.system / 1000) // ms
        },
        uptime: Math.round(process.uptime()), // seconds
        nodeVersion: process.version,
        platform: process.platform
      },
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
};

// Clear cache
exports.clearCache = async (req, res) => {
  try {
    const { pattern } = req.body;
    await hybridCache.clear(pattern);
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
};

// Optimize database
exports.optimizeDatabase = async (req, res) => {
  try {
    const results = await databaseOptimizer.createAllIndexes();
    res.json({ 
      message: 'Database optimization completed',
      results 
    });
  } catch (error) {
    console.error('Error optimizing database:', error);
    res.status(500).json({ error: 'Failed to optimize database' });
  }
};

// Analyze query performance
exports.analyzeQuery = async (req, res) => {
  try {
    const { query, modelName } = req.body;
    const analysis = await databaseOptimizer.analyzeQuery(query, modelName);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing query:', error);
    res.status(500).json({ error: 'Failed to analyze query' });
  }
};