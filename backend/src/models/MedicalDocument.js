const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema({
  consultationId: {
    type: String,
    required: true,
    index: true
  },
  patientId: {
    type: String,
    required: true,
    index: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  storedFilename: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  docType: {
    type: String,
    enum: ['prescription', 'lab_report', 'discharge_summary', 'radiology', 'other'],
    default: 'prescription'
  },
  ocrStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  extractedPreview: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicalDocument', medicalDocumentSchema);
