const express = require('express');
const router = express.Router();
const {
  getEvidenceByConsultation,
  updateEvidenceStatus
} = require('../controllers/evidenceController');

router.get('/:consultationId', getEvidenceByConsultation);
router.patch('/:id', updateEvidenceStatus);

module.exports = router;
