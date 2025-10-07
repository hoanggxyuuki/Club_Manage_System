const express = require('express');
const router = express.Router();
const auth  = require('../middleware/auth');
const chatController = require('../controllers/chatController');


router.get('/users', auth, chatController.getUsersList);


router.get('/list', auth, chatController.getUserChats);


router.get('/:chatId', auth, chatController.getChatHistory);


router.post('/create', auth, chatController.createOrGetChat);


router.post('/message', auth, chatController.sendMessage);


router.delete('/:chatId/messages/:messageId', auth, chatController.deleteMessage);

module.exports = router;