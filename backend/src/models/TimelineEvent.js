const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  consultationId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  eventType: {
    type: String,
    enum: [
      'INTAKE',
      'INTERVIEW',
      'DOCUMENT_UPLOAD',
      'OCR_COMPLETED',
      'RECONSTRUCTION',
      'LAB_RESULT',
      'AYUSH_ASSESSMENT',
      'DOCTOR_VERIFIED',
      'FINALIZED',
      'SYSTEM'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: 'SYSTEM'
  },
  badgeColor: {
    type: String,
    default: 'emerald'
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

timelineEventSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('TimelineEvent', timelineEventSchema);
