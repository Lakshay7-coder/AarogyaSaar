const express = require('express');
const router = express.Router();
const { getTimeline, addEvent } = require('../controllers/timelineController');

router.get('/:patientId', getTimeline);
router.post('/', addEvent);

module.exports = router;
