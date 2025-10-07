const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { upload, uploadWithRateLimit } = require('../middleware/upload');
const { checkRole } = require('../middleware/roles');
const User = require('../models/User');

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, ...uploadWithRateLimit('avatar'), userController.updateProfile);

router.get('/search', authMiddleware, userController.searchUsers);

router.get('/birthdays/today', authMiddleware, userController.getTodayBirthdays);

router.get('/pending-approval', authMiddleware, checkRole(["admin"]), userController.getPendingApprovalUsers);
router.get('/pending-approval/:id', authMiddleware, checkRole(["admin"]), userController.getPendingUserById);

router.get('/approval-status', authMiddleware, checkRole(["admin"]), userController.getUsersByApprovalStatus);

router.put('/approval-status/:id', authMiddleware, checkRole(["admin"]), userController.updateApprovalStatus);

router.put('/interview/:id', authMiddleware, checkRole(["admin"]), userController.setUserToInterview);

router.put('/approve/:id', authMiddleware, checkRole(["admin"]), userController.approveUser);
router.put('/reject/:id', authMiddleware, checkRole(["admin"]), userController.rejectUser);

router.get('/', authMiddleware, userController.getAllUsers);
router.post('/', authMiddleware, checkRole(["admin"]), userController.addUser);
router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id', authMiddleware, checkRole(["admin"]), userController.updateUser);
router.put('/:id/secondary-role', authMiddleware,checkRole(["admin"]), userController.updateSecondaryRole);
router.delete('/:id', authMiddleware, checkRole(["admin"]), userController.deleteUser);

router.put('/approve-user/:userId', authMiddleware, checkRole(["admin"]), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.userId, { role: 'member' }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User approved successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/reject-user/:userId', authMiddleware, checkRole(["admin"]), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;