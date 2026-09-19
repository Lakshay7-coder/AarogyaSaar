const mongoose = require('mongoose');

const doctorVerificationSchema = new mongoose.Schema({
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
  // Supports both MongoDB-backed doctors (ObjectId) and deterministic
  // SIH demo doctors (string IDs such as demo-doctor-id-sih26047).
  doctorId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  findingId: {
    type: String,
    required: true
  },
  findingCategory: {
    type: String,
    required: true
  },
  findingKey: {
    type: String,
    required: true
  },
  previousValue: {
    type: String,
    default: ''
  },
  verifiedValue: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['VERIFY', 'EDIT', 'REJECT', 'ADD_NOTE'],
    required: true
  },
  clinicalNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DoctorVerification', doctorVerificationSchema);
