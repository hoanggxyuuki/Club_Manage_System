const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const {uploadWithRateLimit} = require('../middleware/upload');


router.post('/', auth, evidenceController.submitEvidence);
router.put('/:id', auth, evidenceController.updateEvidence);
router.delete('/:id', auth, evidenceController.deleteEvidence);
router.get('/my-evidences', auth, evidenceController.getMyEvidences);


router.get('/', auth, checkRole(['admin', 'leader']), evidenceController.getAllEvidences);
router.put('/:id/review', auth, checkRole(['admin', 'leader']), evidenceController.reviewEvidence);
router.get('/export', auth, checkRole(['admin', 'leader']), evidenceController.exportEvidences);
module.exports = router;