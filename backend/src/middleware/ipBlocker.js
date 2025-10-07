const BlockedIp = require('../models/blocked_ip');


const getClientIp = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.ip ||
            '0.0.0.0';
};

const checkBlockedIp = async (req, res, next) => {
    try {
        const clientIp = getClientIp(req);
        
        
        const blockedIp = await BlockedIp.findOne({ 
            ipAddress: clientIp, 
            isActive: true 
        });
        
        if (blockedIp) {
            console.log(`Blocked IP attempt: ${clientIp} - Reason: ${blockedIp.reason}`);
            return res.status(403).json({ 
                message: 'Địa chỉ IP của bạn đã bị chặn. Vui lòng liên hệ quản trị viên.',
                blocked: true
            });
        }
        
        
        req.clientIp = clientIp;
        next();
    } catch (error) {
        console.error('Error checking blocked IP:', error);
        next(); 
    }
};

module.exports = { checkBlockedIp, getClientIp };
