const express = require('express');
const router = express.Router();
const {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus
} = require('../controllers/consultationController');

router.route('/')
  .post(createConsultation)
  .get(getConsultations);

router.route('/:id')
  .get(getConsultationById);

router.route('/:id/status')
  .patch(updateConsultationStatus);

module.exports = router;
