const UploadTracking = require('../models/UploadTracking');
const axios = require('axios');


const ipCache = {
  ip: null,
  info: null,
  timestamp: null,
  TTL: 5 * 60 * 1000 
};


const DEFAULT_UPLOAD_LIMITS = {
  WINDOW_MINUTES: 60,          
  MAX_UPLOADS: 30,            
  BLOCK_DURATION: 120,        
  BOT_DETECTION: {
    MIN_INTERVAL_MS: 1000,    
    MAX_BOT_SCORE: 100,       
    SCORE_DECAY: 5,           
    VIOLATION_SCORE: 25       
  }
};


async function getIPDetails() {
  const now = Date.now();
  
  
  if (ipCache.ip && ipCache.timestamp && (now - ipCache.timestamp) < ipCache.TTL) {
    return ipCache;
  }

  try {
    
    const ipifyResponse = await axios.get('https://api.ipify.org?format=json');
    const ip = ipifyResponse.data.ip;

    
    const ipInfo = {
      ip: ip,
      
     
    };

    
    ipCache.ip = ip;
    ipCache.info = ipInfo;
    ipCache.timestamp = now;
    
    return ipCache;
  } catch (error) {
    console.error('Error fetching IP details:', error);
    
    return ipCache.ip ? ipCache : { ip: null, info: null };
  }
}

const uploadRateLimiter = async (req, res, next) => {
  try {
    
    const ipDetails = await getIPDetails();
    if (!ipDetails.ip) {
      console.warn('Could not fetch IP details, falling back to request IP');
    }
    const clientIp = ipDetails.ip || req.clientIp;
    
    
    const LIMITS = req.uploadLimits || DEFAULT_UPLOAD_LIMITS;
    
    
    let tracking = await UploadTracking.findOne({ ip: clientIp });
    const now = new Date();

    
    if (!tracking) {
      tracking = new UploadTracking({
        ip: clientIp,
        location: ipDetails.info?.location,
        provider: ipDetails.info?.provider,
        firstSeen: now,
        lastSeen: now
      });
    } else {
      
      tracking.location = ipDetails.info?.location || tracking.location;
      tracking.provider = ipDetails.info?.provider || tracking.provider;
      tracking.lastSeen = now;
    }

    
    if (tracking.isBlocked()) {
      const remainingTime = Math.ceil((tracking.blockedUntil - now) / 1000 / 60);
      return res.status(429).json({
        error: 'Too many uploads',
        message: `You are temporarily blocked from uploading files. Please try again in ${remainingTime} minutes.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    
    const recentUploads = tracking.uploads.filter(u => 
      u.timestamp > new Date(now - LIMITS.WINDOW_MINUTES * 60000)
    );

    
    if (recentUploads.length > 0) {
      const lastUpload = recentUploads[recentUploads.length - 1].timestamp;
      const timeSinceLastUpload = now - lastUpload;

      
      if (timeSinceLastUpload < LIMITS.BOT_DETECTION.MIN_INTERVAL_MS) {
        tracking.botScore += LIMITS.BOT_DETECTION.VIOLATION_SCORE;
      }
    }

    
    if (recentUploads.length >= LIMITS.MAX_UPLOADS) {
      tracking.blockedUntil = new Date(now.getTime() + LIMITS.BLOCK_DURATION * 60000);
      await tracking.save();
      return res.status(429).json({
        error: 'Too many uploads',
        message: `Upload limit exceeded. Please try again in ${LIMITS.BLOCK_DURATION} minutes.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    
    if (tracking.botScore >= LIMITS.BOT_DETECTION.MAX_BOT_SCORE) {
      tracking.blockedUntil = new Date(now.getTime() + LIMITS.BLOCK_DURATION * 60000);
      await tracking.save();
      return res.status(429).json({
        error: 'Suspicious activity detected',
        message: 'Your upload behavior appears automated. Please try again later.',
        code: 'BOT_DETECTED'
      });
    }

    
    const hoursSinceReset = (now - tracking.lastReset) / (1000 * 60 * 60);
    if (hoursSinceReset >= 1) {
      const decayAmount = Math.floor(hoursSinceReset) * LIMITS.BOT_DETECTION.SCORE_DECAY;
      tracking.botScore = Math.max(0, tracking.botScore - decayAmount);
      tracking.lastReset = now;
    }

    
    tracking.uploads.push({
      timestamp: now,
      fileSize: req.headers['content-length'],
      mimeType: req.headers['content-type'],
      userAgent: req.headers['user-agent']
    });

    
    tracking.uploads = tracking.uploads.filter(u => 
      u.timestamp > new Date(now - LIMITS.WINDOW_MINUTES * 60000)
    );

    
    tracking.totalUploads++;

    await tracking.save();
    next();
  } catch (error) {
    console.error('Upload rate limiter error:', error);
    next(error);
  }
};

module.exports = uploadRateLimiter;