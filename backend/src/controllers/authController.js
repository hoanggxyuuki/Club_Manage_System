const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { verify: verifyHCaptcha } = require('hcaptcha');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const { sendPasswordResetEmail, sendRegistrationEmail } = require('../utils/emailService');

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; 
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

const isValidEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        if (!profile.emails || !profile.emails[0].value) {
            return done(new Error('Thông tin email không hợp lệ'), null);
        }
        
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });
        
        if (!user) {
            return done(null, false, { message: 'Email không tồn tại' });
        }

        if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
        }

        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));


const generateUsername = (fullName) => {
    if (!fullName) return '';
    return fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, '');
};


const generateRandomPassword = (length = 12) => {
    
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    
    
    
    
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "@$!%*?&"[Math.floor(Math.random() * 7)];

    for (let i = 0, n = charset.length; i < length - 4; ++i) { 
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

exports.register = async (req, res) => {
    try {
        
        const { fullName, email, captchaToken } = req.body;
        
        const SystemConfig = require('../models/SystemConfig');
        const registrationEnabled = await SystemConfig.getSetting('registrationEnabled');

        if (registrationEnabled === false) {
            return res.status(403).json({ message: 'Đăng ký thành viên mới tạm thời đã đóng' });
        }
        
        
        if (!fullName || !email) {
            return res.status(400).json({ message: 'Họ tên và email là bắt buộc' });
        }

        if (!captchaToken) {
            return res.status(400).json({ message: 'Cần xác thực CAPTCHA' });
        }

        const hcaptchaResult = await verifyHCaptcha(process.env.HCAPTCHA_SECRET_KEY, captchaToken);
        if (!hcaptchaResult.success) {
            return res.status(400).json({ message: 'Xác thực CAPTCHA thất bại. Vui lòng thử lại.' });
        }
        
        const sanitizedFullName = sanitizeInput(fullName);
        const sanitizedEmail = sanitizeInput(email);

        
        const username = generateUsername(sanitizedFullName);
        if (!username) { 
            return res.status(400).json({ message: 'Không thể tạo tên người dùng từ họ tên được cung cấp.'});
        }

        
        let password = generateRandomPassword(12);
        
        while (!PASSWORD_REGEX.test(password)) {
            password = generateRandomPassword(12);
        }
        
        if (!isValidEmail(sanitizedEmail)) {
            return res.status(400).json({ message: 'Định dạng email không hỗ trợ' });
        }
        
        
        
        
        
        
        
        
        const existingUser = await User.findOne({ 
            $or: [
                { email: sanitizedEmail }
            ] 
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'Người dùng đã tồn tại với email hoặc tên người dùng này' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            username: username, 
            email: sanitizedEmail,
            fullName: sanitizedFullName,
            password: hashedPassword, 
            lastPasswordChange: new Date(),
            role: 'demo' 
        });

        await user.save();

        
        try {
            await sendRegistrationEmail(sanitizedEmail, username, password); 
        } catch (emailError) {
            console.error('Failed to send registration email:', emailError);
            
            
            
        }
        
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(admin => admin._id);
        
        if (adminIds.length > 0) {
            try {
                const { createNotification } = require('./notificationController');
                await createNotification({
                    body: {
                        title: 'Thành viên mới đăng ký',
                        message: `${sanitizedFullName} (${username}) vừa đăng ký tài khoản mới`,
                        type: 'user',
                        recipients: adminIds
                    },
                    user: { _id: user._id }
                });
            } catch (notifyError) {
                console.error('Không thể gửi thông báo:', notifyError);
            }
        }
        
        res.status(201).json({ message: 'Đăng kí thành công. Tài khoản của bạn đang chờ quản trị viên phê duyệt.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Đăng kí thất bại, thử lại sau' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, captchaToken, googleToken, microsoftToken } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email và mật khẩu là cần thiết' });
        }
        
        const sanitizedEmail = sanitizeInput(email);
        
        const ipAddress = req.ip || req.connection.remoteAddress;
        const attemptKey = `${ipAddress}:${sanitizedEmail}`;
        
        const attemptData = loginAttempts.get(attemptKey) || { count: 0, timestamp: Date.now() };
        
        if (attemptData.count >= MAX_LOGIN_ATTEMPTS && 
            Date.now() - attemptData.timestamp < LOCKOUT_TIME) {
            const remainingTime = Math.ceil((LOCKOUT_TIME - (Date.now() - attemptData.timestamp)) / 60000);
            return res.status(429).json({ 
                message: `Quá nhiều lượt đăng nhập, hãy thử lại sau ${remainingTime} phút.` 
            });
        }
        
        if (attemptData.count >= MAX_LOGIN_ATTEMPTS && 
            Date.now() - attemptData.timestamp >= LOCKOUT_TIME) {
            attemptData.count = 0;
            attemptData.timestamp = Date.now();
        }
        
        if (!googleToken && !microsoftToken) {
            if (!captchaToken) {
                return res.status(400).json({ message: 'Cần xác thực capcha' });
            }
            
            const hcaptchaResult = await verifyHCaptcha(process.env.HCAPTCHA_SECRET_KEY, captchaToken);
            if (!hcaptchaResult.success) {
                attemptData.count += 1;
                loginAttempts.set(attemptKey, attemptData);
                return res.status(400).json({ message: 'Xác thực captcha thất bại. Vui lòng thử lại.' });
            }
        }
        
        const user = await User.findOne({ email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') } });
        if (!user) {
            attemptData.count += 1;
            loginAttempts.set(attemptKey, attemptData);
            return res.status(401).json({ message: 'Sai email hoặc mật khẩu' }); 
        }
        
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(401).json({ 
                message: `Tài khoản tạm thời bị khóa. Thử lại sau ${remainingMinutes} phút.` 
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            attemptData.count += 1;
            attemptData.timestamp = Date.now();
            loginAttempts.set(attemptKey, attemptData);
            
            if (attemptData.count >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = Date.now() + LOCKOUT_TIME;
                await user.save();
            }
            
            return res.status(401).json({ message: 'Sai email hoặc mật khẩu' }); 
        }
        
        const passwordAge = user.lastPasswordChange ? Date.now() - user.lastPasswordChange.getTime() : 0;
        const PASSWORD_EXPIRY = 360 * 24 * 60 * 60 * 1000;
        
        if (passwordAge > PASSWORD_EXPIRY) {
            return res.status(401).json({
                message: 'Mật khẩu đã hết hạn. Vui lòng đổi mật khẩu.',
                passwordExpired: true
            });
        }

        loginAttempts.delete(attemptKey);
        
        if (user.lockUntil) {
            user.lockUntil = null;
            await user.save();
        }

        const role = await User.findOne({ _id: user._id }).select('role');
        
        const token = jwt.sign(
            { 
                userId: user._id,
                role: role.role,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '720h',
                issuer: process.env.API_URL || 'club-management-system'
            }
        );

        user.lastLogin = new Date();
        await user.save();

        res.json({ token, role });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Đăng nhập thất bại. Vui lòng thử lại sau.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email, captchaToken } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Cần email' });
        }
        
        const sanitizedEmail = sanitizeInput(email);
        
        if (!isValidEmail(sanitizedEmail)) {
            return res.status(400).json({ message: 'Định dạng email không hỗ trợ' });
        }
        
        const ipAddress = req.ip || req.connection.remoteAddress;
        const resetKey = `reset:${ipAddress}`;
        const resetAttempts = loginAttempts.get(resetKey) || { count: 0, timestamp: Date.now() };
        
        const RESET_LIMIT = 3;
        const RESET_WINDOW = 60 * 60 * 1000; 
        
        if (resetAttempts.count >= RESET_LIMIT && 
            Date.now() - resetAttempts.timestamp < RESET_WINDOW) {
            return res.status(429).json({ 
                message: 'Quá nhiều thử đặt lại mật khẩu. Vui lòng thử lại sau.' 
            });
        }
        
        if (Date.now() - resetAttempts.timestamp >= RESET_WINDOW) {
            resetAttempts.count = 0;
            resetAttempts.timestamp = Date.now();
        }
        
        if (!captchaToken) {
            return res.status(400).json({ message: 'CAPTCHA verification required' });
        }
        
        const hcaptchaResult = await verifyHCaptcha(process.env.HCAPTCHA_SECRET_KEY, captchaToken);
        if (!hcaptchaResult.success) {
            resetAttempts.count += 1;
            loginAttempts.set(resetKey, resetAttempts);
            return res.status(400).json({ message: 'Xác thực captcha thất bại. Vui lòng thử lại.' });
        }
        
        const user = await User.findOne({ email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') } });
        
        if (!user) {
            resetAttempts.count += 1;
            loginAttempts.set(resetKey, resetAttempts);
            
            return res.json({ message: 'Nếu email tồn tại, một hướng dẫn đặt lại mật khẩu sẽ được gửi.' });
        }
        
        if (user.resetPasswordExpires && user.resetPasswordExpires > Date.now() - 5 * 60 * 1000) { 
            resetAttempts.count += 1;
            loginAttempts.set(resetKey, resetAttempts);
            return res.status(429).json({ message: 'Please wait 5 minutes before requesting another reset' });
        }
        
        const resetToken = crypto.randomBytes(48).toString('hex');
        const hash = await bcrypt.hash(resetToken, 12);

        user.resetPasswordToken = hash;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
       
        await sendPasswordResetEmail(sanitizedEmail, resetToken);

        resetAttempts.count += 1;
        loginAttempts.set(resetKey, resetAttempts);
        
        res.json({ message: 'Đã gửi email reset mật khẩu' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Không thể xử lý yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.' });
    }
};

exports.googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    state: crypto.randomBytes(16).toString('hex') 
});

exports.microsoftAuth = passport.authenticate('azuread-openidconnect', {
    scope: ['profile', 'email', 'openid'],
    responseMode: 'form_post',
    responseType: 'code id_token',
    state: crypto.randomBytes(16).toString('hex') 
});

exports.microsoftCallback = (req, res, next) => {
    passport.authenticate('azuread-openidconnect', {
        session: false,
        responseType: 'code id_token',
        responseMode: 'form_post'
    }, async (err, data, info) => {
        try {
            if (err) {
                console.error('Microsoft auth error:', err);
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Authentication error')}`);
            }

            if (!data) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(info?.message || 'Authentication failed')}`);
            }

            const { token, user } = data;
            
            await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
            
            const safeToken = encodeURIComponent(token);
            const safeRole = encodeURIComponent(user.role);
            res.redirect(`${process.env.FRONTEND_URL}/auth/microsoft/callback?token=${safeToken}&role=${safeRole}`);
        } catch (error) {
            console.error('Microsoft callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('An error occurred during authentication')}`);
        }
    })(req, res, next);
};

exports.googleCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
        try {
            if (err) {
                console.error('Google auth error:', err);
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Authentication error')}`);
            }

            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(info?.message || 'Authentication failed')}`);
            }

            const role = await User.findOne({ _id: user._id }).select('role');
            
            const token = jwt.sign(
                {
                    userId: user._id,
                    role: role.role,
                    email: user.email
                },
                process.env.JWT_SECRET,
                { 
                    expiresIn: '720h',
                    issuer: process.env.API_URL || 'club-management-system'
                }
            );

            await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
            
            const safeToken = encodeURIComponent(token);
            const safeRole = encodeURIComponent(role.role);
            res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?token=${safeToken}&role=${safeRole}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('An error occurred during authentication')}`);
        }
    })(req, res, next);
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({ message: 'Token và mật khẩu là bắt buộc' });
        }

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }
       
        const user = await User.findOne({
            resetPasswordToken: { $exists: true },
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+resetPasswordToken +fullName +email');

        if (!user) {
            return res.status(400).json({ message: 'Token không tồn tại hoặc đã hết hạn' });
        }

        const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
        if (!isValidToken) {
            return res.status(400).json({ message: 'Token không hợp lệ' });
        }

        if (!user.fullName || !user.email) {
            return res.status(400).json({
                message: 'Vui lòng cập nhật thông tin cơ bản trước khi đổi mật khẩu',
                missingInfo: {
                    fullName: !user.fullName,
                    email: !user.email
                }
            });
        }

        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                message: 'Mật khẩu mới phải khác mật khẩu cũ' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.lastPasswordChange = new Date();
        user.lockUntil = null; 
        
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Không thể đặt lại mật khẩu. Vui lòng thử lại sau.' });
    }
};

setInterval(() => {
    const now = Date.now();
    loginAttempts.forEach((data, key) => {
        if (now - data.timestamp > 24 * 60 * 60 * 1000) {
            loginAttempts.delete(key);
        }
    });
}, 60 * 60 * 1000);