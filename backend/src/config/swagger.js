const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AarogyaSaar API (SIH26047)',
    version: '1.0.0',
    description: 'AI-powered clinical case intake, reconstruction, evidence provenance, AYUSH assessment, and FHIR/ABDM interoperability platform.'
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Local Development Server'
    }
  ],
  paths: {
    '/auth/demo-login': {
      post: {
        summary: 'Instant Demo Login (Doctor / Patient / Admin)',
        responses: { 200: { description: 'JWT Token and User Profile' } }
      }
    },
    '/patients': {
      post: { summary: 'Register New Patient (Kiosk Intake)' },
      get: { summary: 'List Patients' }
    },
    '/consultations': {
      post: { summary: 'Create Clinical Consultation Encounter' },
      get: { summary: 'List Consultations' }
    },
    '/interview/session': {
      post: { summary: 'Start or resume AI clinical interview session' }
    },
    '/interview/message': {
      post: { summary: 'Send patient voice or text answer, receive adaptive AI next question' }
    },
    '/documents/upload': {
      post: { summary: 'Upload medical document (PDF/PNG/JPG) and trigger OCR structuring' }
    },
    '/cases/reconstruct/{consultationId}': {
      post: { summary: 'Execute Multimodal Clinical Case Reconstruction' }
    },
    '/evidence/{consultationId}': {
      get: { summary: 'Retrieve Evidence & Provenance graph for all clinical findings' }
    },
    '/completeness/{consultationId}': {
      get: { summary: 'Calculate 11-category completeness score and missing follow-ups' }
    },
    '/timeline/{patientId}': {
      get: { summary: 'Get Chronological Patient Journey Timeline' }
    },
    '/ayush/{consultationId}': {
      get: { summary: 'Get Prakriti, Agni, and Ayurvedic lifestyle assessment' },
      post: { summary: 'Save doctor-verified AYUSH assessment' }
    },
    '/doctor/queue': {
      get: { summary: 'Doctor Command Center clinical triage queue' }
    },
    '/doctor/verify': {
      post: { summary: 'Physician verification action (VERIFY / EDIT / REJECT / ADD_NOTE)' }
    },
    '/doctor/finalize/{consultationId}': {
      post: { summary: 'Physician final sign-off and case lock' }
    },
    '/fhir/{consultationId}': {
      get: { summary: 'Generate compliant HL7 FHIR R4 & ABDM-ready Document Bundle' }
    },
    '/demo/seed': {
      post: { summary: 'Seed complete SIH demo patient (Ramesh Kumar) with 100% connected workflow' }
    }
  }
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Swagger] API Documentation mounted at http://localhost:3000/api-docs');
};

module.exports = setupSwagger;
