const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkRole } = require('../middleware/roles');

router.post('/register', authController.register);

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);


router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);


router.get('/microsoft', authController.microsoftAuth);
router.get('/microsoft/callback', authController.microsoftCallback);
router.post('/microsoft/callback', authController.microsoftCallback);
router.get('/microsoft/return', authController.microsoftCallback); 

module.exports = router;