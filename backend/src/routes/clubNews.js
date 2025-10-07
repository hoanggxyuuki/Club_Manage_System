const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const clubNewsController = require('../controllers/clubNewsController');
const  authMiddleware  = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const newsUpload = require('../middleware/newsUpload');


router.get('/admin/all', 
  authMiddleware, 
  checkRole('admin'), 
  clubNewsController.getAllClubNews
);

router.get('/admin/:id', 
  authMiddleware, 
  checkRole('admin'), 
  clubNewsController.getClubNewsById
);

router.post('/admin/create', 
  [
    authMiddleware,
    checkRole('admin'),
    newsUpload.single('image'),
    check('title', 'Tiêu đề là bắt buộc').not().isEmpty(),
    check('content', 'Nội dung là bắt buộc').not().isEmpty(),
  ],
  clubNewsController.createClubNews
);

router.put('/admin/:id', 
  [
    authMiddleware,
    checkRole('admin'),
    newsUpload.single('image'),
    check('title', 'Tiêu đề là bắt buộc').optional().not().isEmpty(),
    check('content', 'Nội dung là bắt buộc').optional().not().isEmpty()
  ],
  clubNewsController.updateClubNews
);

router.delete('/admin/:id', 
  authMiddleware, 
  checkRole('admin'), 
  clubNewsController.deleteClubNews
);


router.get('/pending-user', 
  authMiddleware,
  checkRole('demo'),
  clubNewsController.getClubNewsForPendingUser
);


router.get('/public', 
  clubNewsController.getClubNewsForPendingUser
);


router.get('/member', 
  authMiddleware,
  checkRole('member', 'leader', 'owner'),
  clubNewsController.getClubNewsForMember
);

module.exports = router;