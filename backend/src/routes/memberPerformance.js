const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const memberPerformanceController = require('../controllers/memberPerformanceController');


router.get('/', auth, memberPerformanceController.getAllPerformances);


router.get('/member/:memberId', auth, memberPerformanceController.getMemberPerformance);


router.get('/:memberId/monthly', auth, memberPerformanceController.getMemberMonthlyPerformance);

module.exports = router;