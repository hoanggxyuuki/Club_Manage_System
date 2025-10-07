const { cacheMiddleware, clearCache } = require('../middleware/cache');
const { 
  paginationMiddleware, 
  selectFieldsMiddleware, 
  createOptimizedQuery,
  createOptimizedAggregation 
} = require('../middleware/databaseOptimization');
const User = require('../models/User');
const Member = require('../models/Member');
const Event = require('../models/eventSchema');
const Task = require('../models/Task');

// Tối ưu: Sử dụng cache cho các query thường xuyên
exports.getOptimizedUsers = async (req, res) => {
  try {
    const { pagination, selectFields } = req;
    
    const query = createOptimizedQuery(User, {
      filter: { isActive: true },
      select: selectFields || 'username email fullName avatar role',
      sort: { createdAt: -1 },
      pagination
    });

    const [users, total] = await Promise.all([
      query.exec(),
      User.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    });
  } catch (error) {
    console.error('Error in getOptimizedUsers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Tối ưu: Sử dụng aggregation pipeline cho thống kê
exports.getOptimizedStats = async (req, res) => {
  try {
    const pipeline = [
      {
        $facet: {
          userStats: [
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ],
          memberStats: [
            { $group: { _id: null, total: { $sum: 1 } } }
          ],
          eventStats: [
            { $match: { status: 'active' } },
            { $group: { _id: null, active: { $sum: 1 } } }
          ],
          taskStats: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]
        }
      }
    ];

    const [userStats, memberStats, eventStats, taskStats] = await Promise.all([
      User.aggregate(createOptimizedAggregation(pipeline).pipeline),
      Member.aggregate([
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      Event.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, active: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        users: userStats[0]?.userStats || [],
        members: memberStats[0]?.total || 0,
        events: eventStats[0]?.active || 0,
        tasks: taskStats
      }
    });
  } catch (error) {
    console.error('Error in getOptimizedStats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Tối ưu: Batch operations
exports.batchUpdateUsers = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Updates array is required' 
      });
    }

    // Sử dụng bulkWrite cho hiệu suất tốt hơn
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.userId },
        update: { $set: update.fields }
      }
    }));

    const result = await User.bulkWrite(bulkOps, { ordered: false });

    // Clear cache sau khi update
    clearCache('users');

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users`,
      data: result
    });
  } catch (error) {
    console.error('Error in batchUpdateUsers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Tối ưu: Lazy loading với populate có điều kiện
exports.getUserWithRelations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { include } = req.query;

    let populateOptions = [];
    
    if (include) {
      const includes = include.split(',');
      
      if (includes.includes('events')) {
        populateOptions.push({
          path: 'events',
          select: 'name startDate endDate status',
          match: { status: 'active' }
        });
      }
      
      if (includes.includes('tasks')) {
        populateOptions.push({
          path: 'tasks',
          select: 'title status dueDate',
          match: { status: { $ne: 'completed' } }
        });
      }
      
      if (includes.includes('groups')) {
        populateOptions.push({
          path: 'groups',
          select: 'name description members'
        });
      }
    }

    const user = await User.findById(userId)
      .select('username email fullName avatar role')
      .populate(populateOptions);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getUserWithRelations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Tối ưu: Search với text index
exports.searchOptimized = async (req, res) => {
  try {
    const { q, type = 'users', pagination } = req;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters' 
      });
    }

    let model, searchField;
    
    switch (type) {
      case 'users':
        model = User;
        searchField = { $text: { $search: q } };
        break;
      case 'members':
        model = Member;
        searchField = { $text: { $search: q } };
        break;
      case 'events':
        model = Event;
        searchField = { $text: { $search: q } };
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid search type' 
        });
    }

    const query = createOptimizedQuery(model, {
      filter: searchField,
      sort: { score: { $meta: 'textScore' } },
      pagination
    });

    const [results, total] = await Promise.all([
      query.exec(),
      model.countDocuments(searchField)
    ]);

    res.json({
      success: true,
      data: results,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    });
  } catch (error) {
    console.error('Error in searchOptimized:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = exports; 