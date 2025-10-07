const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// IP Security Middleware
const ipSecurityMiddleware = async (req, res, next) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const clientIP = data.ip;
        console.log("Admin IP là:", clientIP);
        
        // Log admin access attempts
        console.log(`Admin access attempt from IP: ${clientIP} at ${new Date().toISOString()}`);
        
        // Add IP to request for logging
        req.clientIP = clientIP;
        next();
    } catch (error) {
        console.error('Error fetching IP:', error);
        // Fallback to request IP if external API fails
        const fallbackIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
        req.clientIP = fallbackIP;
        console.log("Using fallback IP:", fallbackIP);
        next();
    }
};

// API Key validation for admin operations
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.ADMIN_API_KEY;
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
        return res.status(401).json({
            success: false,
            message: 'API Key không hợp lệ'
        });
    }
    
    next();
};

// Request sanitization
const sanitizeInput = (req, res, next) => {
    // Remove potentially dangerous characters from query params and body
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove script tags, SQL injection patterns, etc.
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                     .replace(/(\$where|\$ne|\$or|\$and|\$not|\$nor|\$exists|\$type|\$mod|\$regex|\$text|\$search)/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    
    next();
};

// Audit logging middleware
const auditLogger = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Log admin operations
        const logData = {
            timestamp: new Date().toISOString(),
            user: req.user ? req.user._id : 'anonymous',
            ip: req.clientIP,
            method: req.method,
            url: req.originalUrl,
            userAgent: req.headers['user-agent'],
            statusCode: res.statusCode,
            responseSize: data ? data.length : 0
        };
        
        // Only log admin operations to a secure log file
        if (req.originalUrl.startsWith('/api/admin/')) {
            console.log('ADMIN_AUDIT:', JSON.stringify(logData));
            // TODO: Write to secure audit log file
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

// CSRF Protection for state-changing operations
const csrfProtection = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.headers['x-csrf-token'];
        const sessionToken = req.session?.csrfToken;
        
        if (!token || !sessionToken || token !== sessionToken) {
            return res.status(403).json({
                success: false,
                message: 'CSRF token không hợp lệ'
            });
        }
    }
    
    next();
};

// Data access logging
const dataAccessLogger = (tableName) => {
    return (req, res, next) => {
        const accessLog = {
            timestamp: new Date().toISOString(),
            user: req.user ? req.user._id : 'anonymous',
            table: tableName,
            action: req.method,
            recordId: req.params.id || null,
            ip: req.clientIP
        };
        
        console.log('DATA_ACCESS:', JSON.stringify(accessLog));
        next();
    };
};

// Advanced rate limiting for different operations
const createAdvancedRateLimit = (options = {}) => {
    const defaults = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: {
            success: false,
            message: 'Rate limit exceeded'
        }
    };
    
    return rateLimit({ ...defaults, ...options });
};

// Specific rate limits for different operations
const rateLimits = {
    // Reading data - more permissive
    read: createAdvancedRateLimit({
        max: 200,
        windowMs: 15 * 60 * 1000
    }),
    
    // Writing data - more restrictive
    write: createAdvancedRateLimit({
        max: 50,
        windowMs: 15 * 60 * 1000
    }),
    
    // Deleting data - very restrictive
    delete: createAdvancedRateLimit({
        max: 10,
        windowMs: 15 * 60 * 1000
    }),
    
    // Bulk operations - extremely restrictive
    bulk: createAdvancedRateLimit({
        max: 5,
        windowMs: 60 * 60 * 1000 // 1 hour
    })
};

// Permission checking for specific tables
const checkTablePermission = (req, res, next) => {
    const { tableName } = req.params;
    const user = req.user;
    
    // Define sensitive tables that require special permissions
    const sensitiveTables = ['users', 'systemConfigs', 'blockedIps'];
    
    if (sensitiveTables.includes(tableName)) {
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập bảng này'
            });
        }
    }
    
    next();
};

module.exports = {
    ipSecurityMiddleware,
    validateApiKey,
    sanitizeInput,
    auditLogger,
    csrfProtection,
    dataAccessLogger,
    rateLimits,
    checkTablePermission
};
