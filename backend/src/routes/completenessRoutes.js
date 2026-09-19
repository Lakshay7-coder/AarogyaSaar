const express = require('express');
const router = express.Router();
const { getCompleteness } = require('../controllers/completenessController');

router.get('/:consultationId', getCompleteness);

module.exports = router;
