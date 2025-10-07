const express = require('express');
const router = express.Router();
const anonymousController = require('../controllers/mail_anonymous');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const anonymousUpload = require('../middleware/anonymousUpload');
const { checkBlockedIp } = require('../middleware/ipBlocker');


router.post('/send-mail', checkBlockedIp, anonymousUpload, anonymousController.sendMail);


router.get('/get-mail', auth, checkRole(['admin', 'leader']), anonymousController.getMail);
router.delete('/delete-mail/:id', auth, checkRole(['admin', 'leader']), anonymousController.deleteMail);


router.get('/blocked-ips', auth, checkRole(['admin', 'leader']), anonymousController.getBlockedIps);
router.post('/block-ip', auth, checkRole(['admin', 'leader']), anonymousController.blockIp);
router.delete('/unblock-ip/:id', auth, checkRole(['admin', 'leader']), anonymousController.unblockIp);


const path = require('path');
router.use('/uploads/anonymous', express.static(path.join(__dirname, '../../uploads/anonymous')));

module.exports = router;