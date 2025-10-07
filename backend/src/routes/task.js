const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.get('/', auth, taskController.getAllTasks);
router.get('/group/:groupId', auth, taskController.getGroupTasks);

router.get('/:taskId', auth, taskController.getTaskById);

router.post('/', auth, taskController.createTask);

router.put('/:taskId/progress', auth, taskController.updateTaskProgress);


router.post('/:taskId/confirm', auth, taskController.confirmTask);


router.delete('/:taskId', auth, taskController.deleteTask);

module.exports = router;