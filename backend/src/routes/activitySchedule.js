const express = require('express');
const router = express.Router();
const  auth  = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const activityScheduleController = require('../controllers/activityScheduleController');


router.post('/', auth, checkRole(['admin', 'leader', 'owner']), activityScheduleController.createActivitySchedule);


router.get('/group/:groupId', auth, activityScheduleController.getGroupSchedules);


router.put('/:id', auth, checkRole(['admin', 'leader', 'owner']), activityScheduleController.updateSchedule);


router.delete('/:id', auth, checkRole(['admin', 'leader', 'owner']), activityScheduleController.deleteSchedule);


router.post('/:id/join', auth, activityScheduleController.joinSchedule);


router.put('/:id/attendees/:userId', auth, checkRole(['admin', 'leader', 'owner']), activityScheduleController.updateAttendeeStatus);


router.get('/:id/attendance', auth, activityScheduleController.getAttendanceStats);

module.exports = router;