const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cors = require('cors');
const requestIp = require('request-ip');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const session = require('express-session');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import performance optimization utilities
const hybridCache = require('./utils/redisCache');
const databaseOptimizer = require('./utils/databaseOptimizer');

// Initialize Redis cache
console.log('🔄 Initializing Redis cache...');
if (process.env.USE_REDIS === 'true') {
    console.log('✅ Redis enabled, attempting connection...');
} else {
    console.log('ℹ️ Redis disabled, using memory cache only');
}

require('./config/passport')(passport);


const uploadsDir = path.join(__dirname, '..', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const forumMediaDir = path.join(uploadsDir, 'forum');
const evidencesDir = path.join(uploadsDir, 'evidences');
const anonymousDir = path.join(uploadsDir, 'anonymous');
const newsDir = path.join(uploadsDir, 'news'); 

[uploadsDir, avatarsDir, forumMediaDir, evidencesDir, anonymousDir, newsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const memberRoutes = require('./routes/members');
const groupRoutes = require('./routes/group');
const notificationRoutes = require('./routes/noti');
const taskRoutes = require('./routes/task');
const eventRoutes = require('./routes/event');
const evidenceRoutes = require('./routes/evidence');
const anonymousmail = require('./routes/anonymous');
const forum = require('./routes/forum');
const bankRoutes = require('./routes/bank');
const chatRoutes = require('./routes/chat');
const matchRoutes = require('./routes/match');
const memberPerformanceRoutes = require('./routes/memberPerformance');
const activityScheduleRoutes = require('./routes/activitySchedule');
const startCronJob = require('./cronJob');
const urlPreviewRoutes = require('./routes/urlPreview');
const systemConfigRoutes = require('./routes/systemConfig');
const encryptResponse = require('./middleware/encryptres');
const pushNotification = require('./routes/push');
const videoRoutes = require('./routes/video');  
const demoNotificationRoutes = require('./routes/demoNotification'); 
const clubNewsRoutes = require('./routes/clubNews');
const adminRoutes = require('./routes/admin'); 

const app = express();
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'api_template', 'index.html'));
});
app.set('trust proxy', true);
app.use(requestIp.mw());

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));


app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Đã kết nối thành công với MongoDB'))
    .catch(err => console.error('Lỗi kết nối MongoDB:', err));


app.use('/', router);
app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/bank')) {
      return next();
    }
    if (req.path.startsWith('/url-preview')) {
        return next();
      }
      if (req.path.startsWith('/blacklist')) {
        return next();
      }
      
    encryptResponse(req, res, next);
  });


 
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')));
app.use('/uploads/forum', express.static(path.join(__dirname, '../uploads/forum')));
app.use('/uploads/evidences', express.static(path.join(__dirname, '../uploads/evidences')));
app.use('/uploads/anonymous', express.static(path.join(__dirname, '../uploads/anonymous')));
app.use('/api/evidences', evidenceRoutes);
app.use('/api/anonymous', anonymousmail);
app.use('/api/forum', forum);

app.use('/api/chat', chatRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/performances', memberPerformanceRoutes);
app.use('/api/schedules', activityScheduleRoutes);
app.use('/api/url-preview', urlPreviewRoutes);
app.use('/api/push', pushNotification);
app.use('/api/video', videoRoutes);  
app.use('/api/system-config', systemConfigRoutes); 
app.use('/api/demo-notifications', demoNotificationRoutes); 
app.use('/api/club-news', clubNewsRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/uploads/news', express.static(path.join(__dirname, '../uploads/news'))); 

const http = require('http');
const { setupSocket } = require('./utils/socketHandler');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

setupSocket(server);

// Performance optimizations
app.use(compression()); // Gzip compression
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// More strict rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
});
app.use('/api/auth', authLimiter);

// Initialize database optimization on startup
app.use(async (req, res, next) => {
  // Create database indexes if not exists
  if (!global.indexesCreated) {
    try {
      await databaseOptimizer.createAllIndexes();
      global.indexesCreated = true;
      console.log('✅ Database indexes initialized');
    } catch (error) {
      console.error('❌ Database index creation failed:', error.message);
    }
  }
  next();
});

// Apply cache middleware to specific routes
app.use('/api/club-news', hybridCache.middleware(600)); // Cache for 10 minutes
app.use('/api/competitions', hybridCache.middleware(300)); // Cache for 5 minutes
app.use('/api/events', hybridCache.middleware(300)); // Cache for 5 minutes

server.listen(PORT, () => {
    console.log(`Máy chủ đang chạy trên cổng ${PORT}`);
});
startCronJob();