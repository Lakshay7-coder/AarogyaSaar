const mongoose = require('mongoose');

const interviewMessageSchema =
  new mongoose.Schema(
    {

      sessionId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          'InterviewSession',

        required: true
      },

      consultationId: {
        type: String,
        required: true,
        index: true
      },

      sender: {
        type: String,

        enum: [
          'ai',
          'patient'
        ],

        required: true
      },

      text: {
        type: String,
        required: true
      },

      inputType: {
        type: String,

        enum: [
          'voice',
          'text',
          'system'
        ],

        default: 'text'
      },

      extractedEntities: {

        symptoms: [
          {
            type: String
          }
        ],

        duration: {
          type: String,
          default: null
        },

        severity: {
          type: String,
          default: null
        },

        frequency: {
          type: String,
          default: null
        },

        associatedSymptoms: [
          {
            type: String
          }
        ],

        medications: [
          {
            type: String
          }
        ],

        allergies: [
          {
            type: String
          }
        ],

        pastHistory: [
          {
            type: String
          }
        ],

        familyHistory: [
          {
            type: String
          }
        ],

        lifestyle: {
          type: Object,
          default: {}
        },

        concerns: [
          {
            type: String
          }
        ],

        redFlags: [
          {
            label: String,
            priority: String,
            source: String
          }
        ]

      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.88
      }

    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    'InterviewMessage',
    interviewMessageSchema
  );