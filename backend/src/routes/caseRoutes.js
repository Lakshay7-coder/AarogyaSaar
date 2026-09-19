const express = require('express');
const router = express.Router();
const {
  reconstructCase,
  getCaseByConsultation
} = require('../controllers/caseController');

router.post('/reconstruct/:consultationId', reconstructCase);
router.get('/:consultationId', getCaseByConsultation);

module.exports = router;
