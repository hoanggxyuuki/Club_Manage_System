const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const systemConfigController = require('../controllers/systemConfigController');


router.get('/registration-status', systemConfigController.getRegistrationStatus);


router.put('/registration-status', authMiddleware, checkRole(['admin']), systemConfigController.updateRegistrationStatus);


router.get('/', authMiddleware, checkRole(['admin']), systemConfigController.getAllConfigs); 
router.put('/:id', authMiddleware, checkRole(['admin']), systemConfigController.updateConfigById); 


router.get('/pending-users', authMiddleware, checkRole(['admin']), systemConfigController.getPendingUsers);
router.put('/pending-users/:userId/approve', authMiddleware, checkRole(['admin']), systemConfigController.approveUser);
router.delete('/pending-users/:userId/reject', authMiddleware, checkRole(['admin']), systemConfigController.rejectUser);

module.exports = router;