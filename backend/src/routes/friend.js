const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const protect  = require('../middleware/auth');




router.post('/request', protect,friendController.sendFriendRequest);


router.put('/respond', protect,friendController.respondToFriendRequest);


router.get('/list', protect,friendController.getFriends);


router.get('/pending', protect, friendController.getPendingRequests);


router.get('/sent', protect, friendController.getSentRequests);


router.get('/search', protect,friendController.searchUsers);


router.delete('/:friendId', protect, friendController.deleteFriend);

module.exports = router;