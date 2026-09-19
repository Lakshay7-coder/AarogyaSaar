const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  consultationId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientId: {
    type: String,
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: [
      'intake',
      'interviewing',
      'documents_uploaded',
      'reconstructed',
      'under_review',
      'verified',
      'finalized'
    ],
    default: 'intake',
    index: true
  },
  chiefComplaint: {
    type: String,
    required: [true, 'Chief complaint is required']
  },
  duration: {
    type: String,
    default: 'A few days'
  },
  consultationType: {
    type: String,
    enum: ['In-Person Outpatient', 'Teleconsultation', 'Emergency Triage', 'AYUSH Wellness Clinic'],
    default: 'In-Person Outpatient'
  },
  vitals: {
    bpSystolic: { type: Number, default: 120 },
    bpDiastolic: { type: Number, default: 80 },
    pulse: { type: Number, default: 72 },
    temperature: { type: Number, default: 98.6 },
    spO2: { type: Number, default: 98 },
    weight: { type: Number, default: 65 },
    height: { type: Number, default: 168 },
    bmi: { type: Number, default: 23.0 }
  },
  consent: {
    given: { type: Boolean, default: false },
    givenAt: { type: Date, default: null },
    version: { type: String, default: 'SIH-DEMO-CONSENT-v1' },
    language: { type: String, default: 'English' }
  },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'High Risk', 'Emergency'],
    default: 'Routine'
  },
  completedSteps: {
    type: [String],
    default: ['INTAKE']
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Consultation', consultationSchema);
