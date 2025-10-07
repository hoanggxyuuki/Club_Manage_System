const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const {
    ipSecurityMiddleware,
    sanitizeInput,
    auditLogger,
    rateLimits,
    checkTablePermission,
    dataAccessLogger
} = require('../middleware/adminSecurity');
const systemConfigController = require('../controllers/systemConfigController');

// Middleware kiểm tra admin - chỉ admin mới có thể truy cập
const adminOnly = [auth, checkRole(['admin'])];

// Input validation middleware
const { body, param, query, validationResult } = require('express-validator');
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu đầu vào không hợp lệ',
            errors: errors.array()
        });
    }
    next();
};

// Apply security middlewares to all admin routes
router.use(ipSecurityMiddleware);
router.use(sanitizeInput);
router.use(auditLogger);

// Basic routes
router.get('/all-data', 
    adminOnly, 
    rateLimits.bulk, 
    dataAccessLogger('all'),
    adminController.getAllData
);

router.get('/stats', 
    adminOnly, 
    rateLimits.read,
    adminController.getStats
);

router.get('/advanced-stats', 
    adminOnly, 
    rateLimits.read,
    adminController.getAdvancedStats
);

// Table data routes with pagination and search
router.get('/table/:tableName', 
    adminOnly,
    rateLimits.read,
    param('tableName').isAlpha().withMessage('Tên bảng không hợp lệ'),
    query('page').optional().isInt({ min: 1 }).withMessage('Số trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Giới hạn phải từ 1-100'),
    query('search').optional().isLength({ max: 100 }).withMessage('Từ khóa tìm kiếm quá dài'),
    validateRequest,
    checkTablePermission,
    dataAccessLogger('table'),
    adminController.getTableData
);

// Record detail route
router.get('/table/:tableName/:id',
    adminOnly,
    rateLimits.read,
    param('tableName').isAlpha().withMessage('Tên bảng không hợp lệ'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validateRequest,
    checkTablePermission,
    dataAccessLogger('record'),
    adminController.getRecordDetail
);

// Create record route
router.post('/table/:tableName',
    adminOnly,
    rateLimits.write,
    param('tableName').isAlpha().withMessage('Tên bảng không hợp lệ'),
    body().isObject().withMessage('Dữ liệu phải là object'),
    validateRequest,
    checkTablePermission,
    dataAccessLogger('create'),
    adminController.createRecord
);

// Update record route
router.put('/table/:tableName/:id',
    adminOnly,
    rateLimits.write,
    param('tableName').isAlpha().withMessage('Tên bảng không hợp lệ'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    body().isObject().withMessage('Dữ liệu phải là object'),
    validateRequest,
    checkTablePermission,
    dataAccessLogger('update'),
    adminController.updateRecord
);

// Delete record route
router.delete('/table/:tableName/:id',
    adminOnly,
    rateLimits.delete,
    param('tableName').isAlpha().withMessage('Tên bảng không hợp lệ'),
    param('id').isMongoId().withMessage('ID không hợp lệ'),
    validateRequest,
    checkTablePermission,
    dataAccessLogger('delete'),
    adminController.deleteRecord
);

// Legacy routes for backward compatibility
router.get('/data/:collection', 
    adminOnly, 
    rateLimits.read,
    adminController.getDataByCollection
);

// Performance monitoring routes
router.get('/performance-metrics', adminOnly, rateLimits.read, systemConfigController.getPerformanceMetrics);
router.post('/clear-cache', adminOnly, rateLimits.write, systemConfigController.clearCache);
router.post('/optimize-database', adminOnly, rateLimits.write, systemConfigController.optimizeDatabase);
router.post('/analyze-query', adminOnly, rateLimits.read, systemConfigController.analyzeQuery);

module.exports = router;
