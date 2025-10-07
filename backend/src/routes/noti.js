const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationController.getMyNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.post('/', auth, notificationController.createNotificationHandler);
router.put('/:notificationId/read', auth, notificationController.markAsRead);
router.put('/read-all', auth, notificationController.markAllAsRead);

module.exports = router;