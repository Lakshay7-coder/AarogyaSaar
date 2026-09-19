const express = require('express');
const router = express.Router();
const {
  getDoctorQueue,
  submitVerification,
  finalizeCase,
  getAuditTrail
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');

router.get('/queue', getDoctorQueue);
router.post('/verify', submitVerification);
router.post('/finalize/:consultationId', finalizeCase);
router.get('/audit-trail/:consultationId', getAuditTrail);

module.exports = router;
