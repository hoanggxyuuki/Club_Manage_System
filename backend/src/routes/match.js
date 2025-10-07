const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const protect = require('../middleware/auth');





router.get('/potential',protect, matchController.getPotentialMatches);


router.get('/', protect,matchController.getMatches);


router.post('/', protect,matchController.createMatch);


router.post('/:matchId/respond',protect, matchController.respondToMatch);

module.exports = router;