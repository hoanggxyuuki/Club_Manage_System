const Evidence = require('../models/evidence');
const Notification = require('../models/notification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Excel = require('exceljs');
const crypto = require('crypto'); 
const sanitize = require('sanitize-filename'); 


const checkPermission = (user, evidence) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'leader') return true;
    return evidence.submittedBy.toString() === user._id.toString() && evidence.status === 'pending';
};


const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true, mode: 0o755 }); 
        } catch (error) {
            console.error('Không thể tạo thư mục:', error);
            throw new Error('Lỗi khi tạo thư mục lưu trữ');
        }
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.resolve('uploads/evidences');
        ensureDirExists(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        
        const randomString = crypto.randomBytes(8).toString('hex');
        const sanitizedName = sanitize(file.originalname);
        cb(null, `${Date.now()}-${randomString}-${sanitizedName}`);
    }
});

const upload = multer({
    storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, 
        files: 1 
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = {
            'image/jpeg': true,
            'image/jpg': true,
            'image/png': true,
            'image/gif': true,
            'application/pdf': true,
            'application/msword': true,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
            'application/vnd.ms-excel': true,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
            'application/vnd.ms-powerpoint': true,
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': true
        };

        if (allowedTypes[file.mimetype]) {
            return cb(null, true);
        }
        cb(new Error('Loại file không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX'));
    }
}).single('evidence');


const validateRequest = (req, res, next) => {
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
    }
    next();
};


const isValidUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch (e) {
        return false;
    }
};

exports.submitEvidence = async (req, res) => {
    try {
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            const { title, description, type, link } = req.body;
            
            
            if (!title || title.trim() === '') {
                return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
            }

            let content = null;

            if (type === 'link') {
                
                if (!isValidUrl(link)) {
                    return res.status(400).json({ message: 'Đường dẫn không hợp lệ' });
                }
                content = link;
            } else if (req.file) {
                
                content = `uploads/evidences/${req.file.filename}`;
            } else {
                return res.status(400).json({ message: 'Minh chứng là bắt buộc' });
            }

            const evidence = new Evidence({
                title,
                description,
                type,
                content,
                submittedBy: req.user._id,
                fileType: req.file ? req.file.mimetype : null
            });

            await evidence.save();

            
            const User = require('../models/User');
            const reviewers = await User.find({ 
                $or: [
                    { role: 'admin' },
                    { role: 'leader' }
                ]
            });
            const reviewerIds = reviewers.map(reviewer => reviewer._id);

            const { createNotification } = require('./notificationController');
            await createNotification({
                body: {
                    title: 'New Evidence Submitted',
                    message: `${req.user.username} has submitted new evidence: ${title}`,
                    type: 'evidence',
                    recipients: reviewerIds
                },
                user: req.user
            });

            res.status(201).json(evidence);
        });
    } catch (error) {
        console.error('Submit evidence error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi nộp minh chứng' });
    }
};

exports.updateEvidence = async (req, res) => {
    try {
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        const evidence = await Evidence.findOne({ 
            _id: req.params.id, 
            submittedBy: req.user._id,
            status: 'pending' 
        });

        if (!evidence) {
            return res.status(404).json({ message: 'Minh chứng không tìm thấy hoặc không thể chỉnh sửa' });
        }

        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            const { title, description, type, link } = req.body;
            
            
            if (!title || title.trim() === '') {
                return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
            }
            
            if (type === 'link') {
                if (!isValidUrl(link)) {
                    return res.status(400).json({ message: 'Đường dẫn không hợp lệ' });
                }
                evidence.content = link;
            } else if (req.file) {
                
                if (evidence.type !== 'link' && evidence.content && fs.existsSync(path.resolve(evidence.content))) {
                    try {
                        fs.unlinkSync(path.resolve(evidence.content));
                    } catch (error) {
                        console.error('Không thể xóa file cũ:', error);
                    }
                }
                
                evidence.content = `uploads/evidences/${req.file.filename}`;
                evidence.fileType = req.file.mimetype;
            }

            evidence.title = title;
            evidence.description = description;
            evidence.type = type;
            evidence.updatedAt = Date.now();

            await evidence.save();

            
            const User = require('../models/User');
            const reviewers = await User.find({ 
                $or: [
                    { role: 'admin' },
                    { role: 'leader' }
                ]
            });
            const reviewerIds = reviewers.map(reviewer => reviewer._id);

            const { createNotification } = require('./notificationController');
            await createNotification({
                body: {
                    title: 'Evidence Updated',
                    message: `${req.user.username} has updated evidence: ${title}`,
                    type: 'evidence',
                    recipients: reviewerIds
                },
                user: req.user
            });

            res.json(evidence);
        });
    } catch (error) {
        console.error('Update evidence error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật minh chứng' });
    }
};

exports.deleteEvidence = async (req, res) => {
    try {
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        let evidence;
        
        
        if (req.user.role === 'admin' || req.user.role === 'leader') {
            evidence = await Evidence.findById(req.params.id);
        } else {
            evidence = await Evidence.findOne({ 
                _id: req.params.id, 
                submittedBy: req.user._id,
                status: 'pending'
            });
        }

        if (!evidence) {
            return res.status(404).json({ message: 'Minh chứng không tìm thấy hoặc không thể xóa' });
        }

        
        if (evidence.type !== 'link' && evidence.content && fs.existsSync(path.resolve(evidence.content))) {
            try {
                fs.unlinkSync(path.resolve(evidence.content));
            } catch (error) {
                console.error('Không thể xóa file:', error);
            }
        }

        await Evidence.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xóa minh chứng thành công' });
    } catch (error) {
        console.error('Delete evidence error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xóa minh chứng' });
    }
};

exports.getAllEvidences = async (req, res) => {
    try {
        
        if (!req.user) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        
        if (req.user.role !== 'admin' && req.user.role !== 'leader') {
            return res.status(403).json({ message: 'Bạn không có quyền xem tất cả minh chứng' });
        }

        const evidences = await Evidence.find()
            .populate('submittedBy', 'username')
            .populate('reviewedBy', 'username')
            .sort('-createdAt');
        res.json(evidences);
    } catch (error) {
        console.error('Get all evidences error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách minh chứng' });
    }
};

exports.reviewEvidence = async (req, res) => {
    try {
        
        if (!req.user) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        
        if (req.user.role !== 'admin' && req.user.role !== 'leader') {
            return res.status(403).json({ message: 'Bạn không có quyền đánh giá minh chứng' });
        }

        const { id } = req.params;  
        const { status, comment } = req.body;
        
        
        if (!status || !['accepted', 'rejected', 'pending','revision_requested'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
        
        const evidence = await Evidence.findById(id);
        if (!evidence) {
            return res.status(404).json({ message: 'Minh chứng không tồn tại' });
        }

        evidence.status = status;
        evidence.reviewComment = comment;
        evidence.reviewedBy = req.user._id;
        evidence.reviewDate = new Date();

        await evidence.save();

        const { createNotification } = require('./notificationController');
        await createNotification({
            body: {
                title: 'Evidence Review Update',
                message: `Your evidence "${evidence.title}" has been ${status}`,
                type: 'evidence',
                recipients: [evidence.submittedBy]
            },
            user: req.user
        });

        res.json(evidence);
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi đánh giá minh chứng' });
    }
};

exports.getMyEvidences = async (req, res) => {
    try {
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        const evidences = await Evidence.find({ submittedBy: req.user._id })
            .populate('reviewedBy', 'username')
            .sort('-createdAt');
        res.json(evidences);
    } catch (error) {
        console.error('Get my evidences error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách minh chứng của bạn' });
    }
};

exports.exportEvidences = async (req, res) => {
    try {
        
        if (!req.user) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        
        if (req.user.role !== 'admin' && req.user.role !== 'leader') {
            return res.status(403).json({ message: 'Bạn không có quyền xuất danh sách minh chứng' });
        }

        const evidences = await Evidence.find()
            .populate('submittedBy', 'username email')
            .populate('reviewedBy', 'username')
            .sort('-createdAt');

        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Evidences');

        worksheet.columns = [
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Description', key: 'description', width: 40 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Submitted By', key: 'submittedBy', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Reviewed By', key: 'reviewedBy', width: 20 },
            { header: 'Submit Date', key: 'createdAt', width: 20 },
            { header: 'Review Date', key: 'reviewDate', width: 20 }
        ];

        evidences.forEach(evidence => {
            worksheet.addRow({
                title: evidence.title,
                description: evidence.description,
                type: evidence.type,
                submittedBy: evidence.submittedBy?.username || 'Unknown',
                email: evidence.submittedBy?.email || 'Unknown',
                status: evidence.status,
                reviewedBy: evidence.reviewedBy?.username || 'Not reviewed',
                createdAt: new Date(evidence.createdAt).toLocaleDateString(),
                reviewDate: evidence.reviewDate ? new Date(evidence.reviewDate).toLocaleDateString() : 'Not reviewed'
            });
        });

        
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=evidences.xlsx'
        );
        
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export evidences error:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi xuất danh sách minh chứng' });
    }
};