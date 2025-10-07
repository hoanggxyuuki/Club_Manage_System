const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');


router.get('/month/current', auth, eventController.getMonthEvents);

router.post('/', auth, checkRole(['admin', 'leader']), eventController.createEvent);

router.get('/', auth, eventController.getEvents);

router.post('/:eventId/join', auth, eventController.joinEvent);

router.put('/:eventId/participants', auth, eventController.updateParticipantStatus);

router.get('/:eventId', auth, eventController.getEventById);


router.put('/:eventId', auth, checkRole(['admin', 'leader']), eventController.updateEvent);


router.delete('/:eventId', auth, checkRole(['admin', 'leader']), eventController.deleteEvent);


router.post('/verify-attendance', auth, eventController.verifyAttendance);


router.get('/attendance/:eventId/:code', eventController.handleExternalQRScan);

router.post('/:eventId/refresh-qr', auth, checkRole(['admin', 'leader']), eventController.refreshQRCode);

module.exports = router;