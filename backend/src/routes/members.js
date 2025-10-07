const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

router.get('/', auth, memberController.getAllMembers);

router.get('/:id', auth, memberController.getMemberById);

router.post('/', auth, checkRole(['admin']), memberController.addMember);

router.put('/:id', auth, checkRole(['admin']), memberController.updateMember);

router.delete('/:id', auth, checkRole(['admin']), memberController.deleteMember);

module.exports = router;