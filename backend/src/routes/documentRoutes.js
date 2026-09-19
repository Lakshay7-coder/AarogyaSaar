const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadDocument,
  getDocumentsByConsultation
} = require('../controllers/documentController');

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/consultation/:id', getDocumentsByConsultation);

module.exports = router;
