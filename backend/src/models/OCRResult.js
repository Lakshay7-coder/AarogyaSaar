const mongoose = require('mongoose');

const ocrResultSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalDocument',
    required: true,
    index: true
  },
  consultationId: {
    type: String,
    required: true,
    index: true
  },
  rawText: {
    type: String,
    default: ''
  },
  structuredFindings: {
    diagnoses: [{ type: String }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    labResults: [{
      testName: String,
      value: String,
      unit: String,
      referenceRange: String,
      isAbnormal: Boolean
    }],
    vitals: {
      bp: String,
      pulse: String,
      temperature: String,
      spo2: String
    },
    doctorNotes: [{ type: String }],
    dates: [{ type: String }],
    procedures: [{ type: String }]
  },
  confidenceScore: {
    type: Number,
    default: 0.85
  },
  engineUsed: {
    type: String,
    default: 'PyMuPDF-ClinicalNLP'
  },
  processingTimeMs: {
    type: Number,
    default: 320
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OCRResult', ocrResultSchema);
