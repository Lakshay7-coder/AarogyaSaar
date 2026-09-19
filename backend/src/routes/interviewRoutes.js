const express = require('express');
const router = express.Router();
const {
  startOrGetSession,
  postMessage,
  getInterviewMessages
} = require('../controllers/interviewController');

router.post('/session', startOrGetSession);
router.post('/message', postMessage);
router.get('/messages/:consultationId', getInterviewMessages);

module.exports = router;
