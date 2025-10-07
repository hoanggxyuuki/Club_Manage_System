const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadRateLimiter = require('./uploadRateLimiter');
const { checkFileForVirus } = require('../controllers/checkvirus');
const crypto = require('crypto');


const ANONYMOUS_UPLOAD_LIMITS = {
    WINDOW_MINUTES: 30,        
    MAX_UPLOADS: 10,          
    BLOCK_DURATION: 180,      
    BOT_DETECTION: {
        MIN_INTERVAL_MS: 2000, 
        MAX_BOT_SCORE: 80,    
        SCORE_DECAY: 2,       
        VIOLATION_SCORE: 30    
    }
};


const uploadDir = path.join(__dirname, '../../uploads/anonymous');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}


const generateSecureFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1E9).toString();
    const hash = crypto
        .createHash('sha256')
        .update(`${timestamp}-${randomString}-${originalName}`)
        .digest('hex')
        .substring(0, 16);
    
    return `anonymous-${hash}${path.extname(originalName)}`;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const filename = generateSecureFilename(file.originalname);
        
        
        if (!req.tempFilePaths) req.tempFilePaths = {};
        if (!req.finalFilePaths) req.finalFilePaths = {};
        
        const fieldname = file.fieldname;
        req.tempFilePaths[fieldname] = path.join(tempDir, filename);
        req.finalFilePaths[fieldname] = path.join(uploadDir, filename);
        
        
        if (!req.uploadedFiles) {
            req.uploadedFiles = [];
        }
        req.uploadedFiles.push({
            fieldname: fieldname,
            filename: filename,
            mimetype: file.mimetype,
            tempPath: req.tempFilePaths[fieldname],
            finalPath: req.finalFilePaths[fieldname]
        });
        
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Please upload only images.'), false);
    }
    
    
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp']
    };
    
    if (!validExtensions[file.mimetype].includes(ext)) {
        return cb(new Error('File extension does not match its content type.'), false);
    }
    
    cb(null, true);
};


const fields = Array.from({ length: 5 }, (_, i) => ({
    name: `media_${i}`,
    maxCount: 1
}));

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, 
        files: 5 
    },
    fileFilter: fileFilter
}).fields(fields);


const scanUploadedFiles = async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(); 
    }
    
    try {
        
        const infectedFiles = [];
        
        
        const scanPromises = [];
        
        Object.keys(req.files).forEach(fieldname => {
            req.files[fieldname].forEach(file => {
                scanPromises.push(
                    checkFileForVirus({ 
                        path: file.path,
                        originalname: file.originalname 
                    }).then(result => {
                        if (result.isVirus) {
                            infectedFiles.push(file.filename);
                            
                            fs.unlinkSync(file.path);
                        }
                        return result;
                    }).catch(err => {
                        console.error(`Error scanning file ${file.filename}:`, err);
                        
                        fs.unlinkSync(file.path);
                        throw err;
                    })
                );
            });
        });
        
        
        const scanResults = await Promise.all(scanPromises);
        
        
        if (infectedFiles.length > 0) {
            return res.status(400).json({
                error: 'Security threat detected in uploaded file(s). Upload rejected.',
                infectedFiles: infectedFiles
            });
        }
        
        
        req.uploadedFiles.forEach(file => {
            fs.renameSync(file.tempPath, file.finalPath);
        });
        
        next();
    } catch (error) {
        console.error('Error during virus scanning:', error);
        
        
        req.uploadedFiles?.forEach(file => {
            if (fs.existsSync(file.tempPath)) {
                fs.unlinkSync(file.tempPath);
            }
        });
        
        return res.status(500).json({
            error: 'Unable to verify file security. Upload rejected.',
            details: error.message
        });
    }
};

module.exports = (req, res, next) => {
    
    const anonymousRateLimiter = (req, res, next) => {
        
        req.uploadLimits = ANONYMOUS_UPLOAD_LIMITS;
        uploadRateLimiter(req, res, next);
    };

    
    anonymousRateLimiter(req, res, (err) => {
        if (err) {
            return res.status(429).json({
                message: err.message,
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    message: 'Upload error: ' + (err.code === 'LIMIT_FILE_SIZE'
                        ? 'File size is too large (max 10MB)'
                        : err.message)
                });
            } else if (err) {
                return res.status(400).json({ message: err.message });
            }
            
            
            scanUploadedFiles(req, res, next);
        });
    });
};