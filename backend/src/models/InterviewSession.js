const mongoose = require('mongoose');

const interviewSessionSchema =
  new mongoose.Schema(
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

      status: {
        type: String,
        enum: [
          'active',
          'paused',
          'completed'
        ],
        default: 'active'
      },

      language: {
        type: String,
        default: 'English'
      },

      /*
       * This is the current adaptive interview position.
       *
       * It is NOT used to blindly determine what the patient
       * must answer.
       */
      currentStepIndex: {
        type: Number,
        default: 0
      },

      totalStepsExpected: {
        type: Number,
        default: 6
      },

      /*
       * Live clinical information accumulated during
       * the interview.
       */
      extractedSummary: {
        type: Object,
        default: {}
      },

      /*
       * Temporary answer awaiting patient confirmation.
       *
       * This is deliberately stored separately from
       * InterviewMessage so an incorrect voice transcription
       * does not become part of the official clinical history.
       */
      pendingConfirmation: {

        active: {
          type: Boolean,
          default: false
        },

        answer: {
          type: String,
          default: ''
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

        question: {
          type: String,
          default: ''
        }

      }

    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    'InterviewSession',
    interviewSessionSchema
  );