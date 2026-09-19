const express = require('express');
const router = express.Router();
const { getFhirRecord, downloadFhirBundle } = require('../controllers/fhirController');

router.get('/:consultationId', getFhirRecord);
router.get('/download/:consultationId', downloadFhirBundle);

module.exports = router;
