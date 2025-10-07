const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const translationController = require('../controllers/translationController');
const auth = require('../middleware/auth');
const forumUpload = require('../middleware/forumUpload');
const {uploadWithRateLimit} = require('../middleware/upload');


router.post('/', auth, forumUpload, forumController.createForum);
router.get('/suggestions', auth, forumController.getSearchSuggestions);
router.get('/search', auth, forumController.searchPosts);

router.post('/translate', auth, translationController.translateText);
router.post('/detect-language', auth, translationController.detectLanguage);

router.get('/', auth, forumController.getAllPosts);
router.get('/:id', auth, forumController.getPost);
router.put('/:id', auth, forumController.updatePost);
router.delete('/:id', auth, forumController.deletePost);
router.post('/:id/like', auth, forumController.toggleLike);
router.post('/:id/comment', auth, forumController.addComment);
router.post('/:id/poll', auth, forumController.addPoll);
router.post('/:id/poll/:pollId/vote', auth, forumController.voteOnPoll);
router.post('/:id/comment/:commentId/reply', auth, forumController.addReplyToComment);

module.exports = router;