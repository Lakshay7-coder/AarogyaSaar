const express = require('express');
const router = express.Router();
const { createPatient, getPatients, getPatientById } = require('../controllers/patientController');

router.route('/')
  .post(createPatient)
  .get(getPatients);

router.route('/:id')
  .get(getPatientById);

module.exports = router;
