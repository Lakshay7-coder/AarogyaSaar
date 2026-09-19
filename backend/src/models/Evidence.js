const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
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
  findingCategory: {
    type: String,
    enum: ['symptom', 'medication', 'vital', 'diagnosis', 'lab', 'allergy', 'ayush', 'history'],
    required: true
  },
  findingKey: {
    type: String,
    required: true
  },
  findingValue: {
    type: String,
    required: true
  },
  sourceType: {
    type: String,
    enum: [
      'PATIENT_INTERVIEW',
      'MEDICAL_DOCUMENT',
      'OCR',
      'PATIENT_HISTORY',
      'DOCTOR_ENTERED'
    ],
    required: true
  },
  sourceName: {
    type: String,
    required: true
  },
  sourceReferenceId: {
    type: String,
    default: ''
  },
  sourceSnippet: {
    type: String,
    default: ''
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.9
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'EDITED', 'REJECTED'],
    default: 'PENDING'
  },
  doctorNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Evidence', evidenceSchema);
