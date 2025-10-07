const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const competitionController = require('../controllers/competitionController');
const { checkRole } = require('../middleware/roles');


router.post('/', auth, checkRole(["admin","leader"]), competitionController.createCompetition);


router.get('/', auth, competitionController.getCompetitions);


router.get('/:id', auth, competitionController.getCompetitionById);


router.post('/:id/join', auth, competitionController.joinCompetition);


router.put('/:id/score/:memberId', auth,checkRole(["admin","leader"]), competitionController.updateScore);


router.post('/:id/end', auth,checkRole(["admin","leader"]), competitionController.endCompetition);


router.put('/:id', auth, checkRole(["admin","leader"]),competitionController.updateCompetition);


router.delete('/:id', auth,checkRole(["admin","leader"]), competitionController.deleteCompetition);

module.exports = router;