const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadRateLimiter = require('./uploadRateLimiter');


const uploadDir = path.join(__dirname, '../../uploads/forum');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'forum-' + uniqueSuffix + ext;
        
        
        if (!req.uploadedFiles) {
            req.uploadedFiles = [];
        }
        req.uploadedFiles.push({
            filename: filename,
            mimetype: file.mimetype
        });
        
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Please upload only images or videos.'), false);
    }
};


const fields = Array.from({ length: 10 }, (_, i) => ({
    name: `media_${i}`,
    maxCount: 1
}));

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 
    },
    fileFilter: fileFilter
}).fields(fields);

module.exports = (req, res, next) => {
    
    uploadRateLimiter(req, res, (err) => {
        if (err) {
            return res.status(429).json({ message: err.message });
        }

        
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                
                return res.status(400).json({
                    message: 'Upload error: ' + (err.code === 'LIMIT_FILE_SIZE'
                        ? 'File size is too large (max 50MB)'
                        : err.message)
                });
            } else if (err) {
                
                return res.status(400).json({ message: err.message });
            }
            
            
            next();
        });
    });
};