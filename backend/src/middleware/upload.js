const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadRateLimiter = require('./uploadRateLimiter');
const { checkFileForVirus } = require('../controllers/checkvirus');
const crypto = require('crypto');

const uploadWithRateLimit = (field) => {
    return [uploadRateLimiter, upload.single(field), virusScanMiddleware];
};

const uploadDir = path.join(__dirname, '../../uploads/avatars');
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
    
    return `avatar-${hash}${path.extname(originalName)}`;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const filename = generateSecureFilename(file.originalname);
        req.tempFilePath = path.join(tempDir, filename);
        req.finalFilePath = path.join(uploadDir, filename);
        req.avatarPath = path.join('uploads/avatars', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 'image/pjpeg', 
        'image/png', 
        'image/gif', 
        'image/webp'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    const mimeToExtMap = { 
        'image/jpeg': ['.jpg', '.jpeg', '.jpe', '.jif', '.jfif', '.jfi'],
        'image/pjpeg': ['.jpg', '.jpeg', '.jpe', '.jif', '.jfif', '.jfi'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp']
    };
    
    const expectedExtensions = mimeToExtMap[file.mimetype];
    if (!expectedExtensions || !expectedExtensions.includes(ext)) {
        return cb(new Error(`File extension '${ext}' does not match its content type '${file.mimetype}'. Permitted extensions for this type are: ${expectedExtensions ? expectedExtensions.join(', ') : 'none'}.`), false);
    }
    
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, 
        files: 1 
    },
    fileFilter: fileFilter
});


const virusScanMiddleware = async (req, res, next) => {
    if (!req.file) {
        return next(); 
    }
    
    try {
        
        const scanResult = await checkFileForVirus({ 
            path: req.file.path,
            originalname: req.file.originalname 
        });
        
        const { logScanResult } = require('../controllers/checkvirus');
        logScanResult(scanResult);
        
        if (scanResult.isVirus) {
            console.error(`Security threat detected: ${scanResult.message}`);
            
          
            try {
                if (fs.existsSync(req.file.path)) { 
                    fs.unlinkSync(req.file.path);
                    console.log(`Successfully deleted infected file: ${req.file.path}`);
                }
            } catch (deleteError) {
                console.error(`Failed to delete infected file: ${deleteError.message}`);
            }
            
            return res.status(400).json({ 
                error: 'Security threat detected in the uploaded file. Upload rejected.',
                details: scanResult.message,
                logs: scanResult.scanLog
            });
        }
        
        
        
        const tempFilePath = req.tempFilePath || (req.file ? req.file.path : null);
        const finalFilePath = req.finalFilePath || (req.file ? constructFinalPath(req.file) : null); 

        if (!tempFilePath || !finalFilePath) {
            console.error('Temporary or final file path is not defined.');
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath); 
            }
            return res.status(500).json({ error: 'Error processing upload due to missing file paths.' });
        }

        const finalDirPath = path.dirname(finalFilePath);
        fs.mkdir(finalDirPath, { recursive: true }, (mkdirErr) => {
            if (mkdirErr) {
                console.error('Error creating destination directory:', mkdirErr);
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath); 
                }
                return res.status(500).json({ error: 'Error processing upload. Failed to create destination directory.' });
            }

            fs.copyFile(tempFilePath, finalFilePath, (copyErr) => {
                if (copyErr) {
                    console.error('Error copying file:', copyErr);
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath); 
                    }
                    
                    if (fs.existsSync(finalFilePath)) {
                        fs.unlinkSync(finalFilePath);
                    }
                    return res.status(500).json({ error: 'Error processing upload. Failed to copy file.' });
                }

                
                fs.unlink(tempFilePath, (unlinkErr) => {
                    if (unlinkErr) {
                        
                        console.warn('Error deleting temporary file after successful copy:', unlinkErr);
                    }
                    
                    
                    if (req.file && req.file.path) {
                        req.file.path = finalFilePath;
                    }
                    if (req.file && req.file.destination) {
                        req.file.destination = finalDirPath;
                    }
                    
                    
                    next(); 
                });
            });
        });
    } catch (error) {
        console.error('Virus scan error:', error);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`Deleted file due to scan error: ${req.file.path}`);
            } catch (deleteError) {
                console.error(`Failed to delete file after scan error: ${deleteError.message}`);
            }
        }
        return res.status(500).json({ 
            error: 'Unable to verify file security. Upload rejected.',
            details: error.message
        });
    }
};

module.exports = {
    upload: upload,
    uploadWithRateLimit,
    virusScanMiddleware
};