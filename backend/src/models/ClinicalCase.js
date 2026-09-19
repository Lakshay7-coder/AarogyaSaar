const mongoose = require('mongoose');

const clinicalCaseSchema = new mongoose.Schema(
  {
    consultationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    patientId: {
      type: String,
      required: true,
      index: true
    },

    chiefComplaint: {
      type: String,
      required: true
    },

    clinicalSummary: {
      type: String,
      required: true
    },

    symptoms: [
      {
        name: String,
        duration: String,
        severity: String,
        frequency: String,
        source: String,
        sourceRef: String
      }
    ],

    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        source: String,
        status: {
          type: String,
          default: 'Active'
        }
      }
    ],

    allergies: [
      {
        substance: String,
        reaction: String,
        severity: String,
        source: String
      }
    ],

    vitals: {
      type: Object,
      default: {}
    },

    labFindings: [
      {
        testName: String,
        value: String,
        unit: String,
        referenceRange: String,
        isAbnormal: Boolean,
        source: String
      }
    ],

    previousDiagnoses: [
      {
        condition: String,
        diagnosedDate: String,
        source: String
      }
    ],

    unresolvedQuestions: [
      {
        type: String
      }
    ],

    contradictions: [
      {
        conflictType: String,
        description: String,
        itemA: String,
        itemB: String,
        severity: String
      }
    ],

    redFlags: [
      {
        label: String,
        priority: String,
        source: String
      }
    ],

    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.91
    },

    isVerifiedByDoctor: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: [
        'draft',
        'reconstructed',
        'in_review',
        'verified',
        'finalized'
      ],
      default: 'reconstructed'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ClinicalCase', clinicalCaseSchema);