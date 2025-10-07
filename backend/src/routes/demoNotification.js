const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const demoNotificationController = require('../controllers/demoNotificationController');
const  authMiddleware  = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');


router.get('/admin/all', 
  authMiddleware, 
  checkRole('admin'), 
  demoNotificationController.getAllDemoNotifications
);

router.get('/admin/:id', 
  authMiddleware, 
  checkRole('admin'), 
  demoNotificationController.getDemoNotificationById
);

router.post('/admin/create', 
  [
    authMiddleware,
    checkRole('admin'),
    check('title', 'Tiêu đề là bắt buộc').not().isEmpty(),
    check('content', 'Nội dung là bắt buộc').not().isEmpty(),
    check('status', 'Trạng thái không hợp lệ').isIn(['pending', 'update', 'info', 'success', 'warning', 'error'])
  ],
  demoNotificationController.createDemoNotification
);

router.put('/admin/:id', 
  [
    authMiddleware,
    checkRole('admin'),
    check('title', 'Tiêu đề là bắt buộc').optional().not().isEmpty(),
    check('content', 'Nội dung là bắt buộc').optional().not().isEmpty(),
    check('status', 'Trạng thái không hợp lệ').optional().isIn(['pending', 'update', 'info', 'success', 'warning', 'error'])
  ],
  demoNotificationController.updateDemoNotification
);

router.delete('/admin/:id', 
  authMiddleware, 
  checkRole('admin'), 
  demoNotificationController.deleteDemoNotification
);


router.get('/pending-user', 
  authMiddleware,
  checkRole('demo'),
  demoNotificationController.getDemoNotificationsForPendingUser
);


router.get('/public', 
  demoNotificationController.getActiveDemoNotifications
);

module.exports = router;