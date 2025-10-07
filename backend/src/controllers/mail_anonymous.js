const AnonymousMail = require('../models/anonymous_mail');
const BlockedIp = require('../models/blocked_ip');
const { verify: verifyHCaptcha } = require('hcaptcha');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');


exports.mailRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: {
        message: 'Quá nhiều yêu cầu từ địa chỉ IP của bạn, vui lòng thử lại sau.'
    }
});


const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return xss(input.trim());
    }
    return input;
};


const validateFiles = (files) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; 
    const MAX_FILES = 5;

    if (!files || files.length === 0) return { valid: true };
    if (files.length > MAX_FILES) return { valid: false, message: 'Số lượng file vượt quá giới hạn cho phép.' };

    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, message: 'Kích thước file vượt quá giới hạn cho phép (5MB).' };
        }
    }
    return { valid: true };
};


const getClientIp = (req) => {
    return req.headers['x-forwarded-for'] || 
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.ip ||
            '0.0.0.0';
};


const getIpFromApi = async () => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
        if (response.data && response.data.ip) {
            return response.data.ip;
        }
        return '0.0.0.0';
    } catch (error) {
        console.error('Lỗi khi lấy địa chỉ IP từ API:', error.message);
        return '0.0.0.0';
    }
};

exports.sendMail = async (req, res) => {
    const requestId = uuidv4(); 
    
    try {
        
        const clientIp = req.clientIp || getClientIp(req);
        const ipFromApi = await getIpFromApi();
        
        console.log(`[${requestId}] Bắt đầu xử lý yêu cầu gửi mail ẩn danh từ IP request: ${clientIp}, IP API: ${ipFromApi}`);

        const { title, description, captchaToken } = req.body;
        
        
        if (!title || !description) {
            return res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống.' });
        }

        if (title.length > 200) {
            return res.status(400).json({ message: 'Tiêu đề không được vượt quá 200 ký tự.' });
        }

        if (description.length > 5000) {
            return res.status(400).json({ message: 'Nội dung không được vượt quá 5000 ký tự.' });
        }

        
        const hcaptchaPromise = verifyHCaptcha(process.env.HCAPTCHA_SECRET_KEY, captchaToken);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout verifying captcha')), 5000)
        );
        
        const hcaptchaResult = await Promise.race([hcaptchaPromise, timeoutPromise]);
        
        if (!hcaptchaResult.success) {
            console.log(`[${requestId}] Xác thực captcha thất bại cho IP: ${clientIp}`);
            return res.status(400).json({ message: 'Xác thực captcha thất bại. Vui lòng thử lại.' });
        }

        
        const fileValidation = validateFiles(req.uploadedFiles);
        if (!fileValidation.valid) {
            return res.status(400).json({ message: fileValidation.message });
        }

        
        const sanitizedTitle = sanitizeInput(title);
        const sanitizedDescription = sanitizeInput(description);

        
        const mailData = {
            title: sanitizedTitle,
            description: sanitizedDescription,
            files: [],
            imageUrls: [],
            ipAddress: clientIp,
            ipAddressFromApi: ipFromApi
        };

        
        if (req.uploadedFiles && req.uploadedFiles.length > 0) {
            mailData.files = req.uploadedFiles;
        }

        
        const imageUrlsString = req.body.imageUrls;
        if (imageUrlsString) {
            try {
                const parsedUrls = JSON.parse(imageUrlsString);
                
                if (Array.isArray(parsedUrls)) {
                    
                    const sanitizedUrls = parsedUrls
                        .filter(url => typeof url === 'string' && validator.isURL(url, { protocols: ['http', 'https'] }))
                        .map(url => sanitizeInput(url));
                    
                    if (sanitizedUrls.length > 0) {
                        mailData.imageUrls = sanitizedUrls;
                    }
                }
            } catch (e) {
                console.error(`[${requestId}] Lỗi phân tích cú pháp imageUrls:`, e);
            }
        }

        const mail = new AnonymousMail(mailData);
        await mail.save();
        
        console.log(`[${requestId}] Mail ẩn danh đã được lưu thành công, ID: ${mail._id} từ IP request: ${clientIp}, IP API: ${ipFromApi}`);
        
        res.status(200).json({
            message: "Sent successfully, thank you for sending us!",
            createdAt: mail.createdAt
        });
    } catch (error) {
        const clientIp = req.clientIp || getClientIp(req);
        console.error(`[${requestId}] Lỗi trong quá trình gửi mail từ IP ${clientIp}:`, error);
        res.status(400).json({ 
            message: error.message || "Error sending mail"
        });
    }
};

exports.getMail = async (req, res) => {
    try {
        
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({ message: 'Không có quyền truy cập' });
        }
        
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const mails = await AnonymousMail.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AnonymousMail.countDocuments();
        
        res.status(200).json({
            mails,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách mail:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMail = async (req, res) => {
    try {
        
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({ message: 'Không có quyền truy cập' });
        }

        
        if (!validator.isMongoId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }

        const mail = await AnonymousMail.findById(req.params.id);
        if (!mail) {
            return res.status(404).json({ message: "Mail not found" });
        }

        await mail.deleteOne();
        
        
        console.log(`Mail ID ${req.params.id} đã bị xóa bởi người dùng ${req.user ? req.user.username : 'unknown'}`);
        
        res.status(200).json({ message: "Mail deleted successfully" });
    } catch (error) {
        console.error('Lỗi khi xóa mail:', error);
        res.status(400).json({ message: error.message });
    }
};


exports.getBlockedIps = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const blockedIps = await BlockedIp.find({ isActive: true })
            .populate('blockedBy', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await BlockedIp.countDocuments({ isActive: true });
        
        res.status(200).json({
            blockedIps,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách IP bị chặn:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.blockIp = async (req, res) => {
    try {
        const { ipAddress, reason } = req.body;
        
        if (!ipAddress || !validator.isIP(ipAddress)) {
            return res.status(400).json({ message: 'Địa chỉ IP không hợp lệ' });
        }

        
        const existingBlock = await BlockedIp.findOne({ ipAddress, isActive: true });
        if (existingBlock) {
            return res.status(400).json({ message: 'IP này đã bị chặn' });
        }

        const blockedIp = new BlockedIp({
            ipAddress,
            reason: reason || 'Blocked by admin',
            blockedBy: req.user._id
        });

        await blockedIp.save();
        
        console.log(`IP ${ipAddress} đã bị chặn bởi ${req.user.username}`);
        
        res.status(200).json({ 
            message: 'IP đã được chặn thành công',
            blockedIp 
        });
    } catch (error) {
        console.error('Lỗi khi chặn IP:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.unblockIp = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!validator.isMongoId(id)) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }

        const blockedIp = await BlockedIp.findById(id);
        if (!blockedIp) {
            return res.status(404).json({ message: 'Không tìm thấy IP bị chặn' });
        }

        blockedIp.isActive = false;
        await blockedIp.save();
        
        console.log(`IP ${blockedIp.ipAddress} đã được bỏ chặn bởi ${req.user.username}`);
        
        res.status(200).json({ message: 'IP đã được bỏ chặn thành công' });
    } catch (error) {
        console.error('Lỗi khi bỏ chặn IP:', error);
        res.status(500).json({ message: error.message });
    }
};