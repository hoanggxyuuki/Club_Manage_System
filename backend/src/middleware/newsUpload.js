const multer = require('multer');
const path = require('path');
const fs = require('fs');


const newsUploadDir = path.join(process.cwd(), 'uploads', 'news');
if (!fs.existsSync(newsUploadDir)) {
  fs.mkdirSync(newsUploadDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, newsUploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Loại file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF và WEBP.'), false);
  }
};


const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: fileFilter
});

module.exports = upload;