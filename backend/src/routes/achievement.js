const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const achievementController = require('../controllers/achievementController');
const { checkRole } = require('../middleware/roles');


router.post('/', auth, checkRole(["admin", "leader"]), achievementController.createAchievement);


router.get('/', auth, achievementController.getAllAchievements);


router.get('/member/:memberId', auth, achievementController.getMemberAchievements);


router.post('/evaluate/:memberId', auth, checkRole(["admin", "leader"]), achievementController.evaluateAndAward);


router.post('/:achievementId/award/:memberId', auth, checkRole(["admin", "leader"]), achievementController.awardAchievement);


router.put('/:id', auth, checkRole(["admin", "leader"]), achievementController.updateAchievement);


router.delete('/:id', auth, checkRole(["admin", "leader"]), achievementController.deleteAchievement);

module.exports = router;