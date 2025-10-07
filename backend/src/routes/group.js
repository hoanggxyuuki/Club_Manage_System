const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

router.get('/my-groups', auth, groupController.getMyGroups);

router.get('/:groupId', auth, groupController.getGroupById);

router.post('/', auth, groupController.createGroup);

router.post('/:groupId/members', auth, groupController.addMemberToGroup);


router.delete('/:groupId/members/:userId', auth, groupController.removeMemberFromGroup);


router.put('/:groupId/members/:userId/role', auth, checkRole(['owner', 'leader']), groupController.updateMemberRole);


router.delete('/:groupId', auth, checkRole(['owner', 'leader', 'admin']), groupController.deleteGroup);


router.get('/search-users', auth, groupController.searchUsers);

module.exports = router;