const express = require('express');
const router = express.Router();
const {
  getAyushAssessment,
  saveAyushAssessment
} = require('../controllers/ayushController');

router.get('/:consultationId', getAyushAssessment);
router.post('/:consultationId', saveAyushAssessment);

module.exports = router;
