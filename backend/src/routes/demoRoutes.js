const express = require('express');
const router = express.Router();
const { seedSihDemoPatient, resetDemoData } = require('../controllers/demoController');

router.post('/seed', seedSihDemoPatient);
router.post('/reset', resetDemoData);

module.exports = router;
