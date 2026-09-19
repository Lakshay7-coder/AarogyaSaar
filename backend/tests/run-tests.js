/**
 * AarogyaSaar (SIH26047) Automated API & Pipeline Test Suite
 * Tests all 12 core workflow milestones.
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

const results = [];

function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const statusMark = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusMark}: ${name} ${details ? `(${details})` : ''}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 AAROGYASAAR (SIH26047) AUTOMATED INTEGRATION TESTS');
  console.log(`Target: ${BASE_URL}`);
  console.log('======================================================\n');

  let doctorToken = '';
  let testPatientId = '';
  let testConsultationId = '';

  try {
    // 1. Health Check
    try {
      const healthRes = await axios.get(`${BASE_URL}/health`);
      recordTest('Screen 0: API & Database Health Check', healthRes.data.status === 'healthy', `DB: ${healthRes.data.database?.status}`);
    } catch (e) {
      recordTest('Screen 0: API & Database Health Check', false, e.message);
    }

    // 2. Demo Seeding (Fast comprehensive check)
    try {
      const seedRes = await axios.post(`${BASE_URL}/demo/seed`);
      recordTest('SIH Demo Seeder: Seed Full Continuous Journey', seedRes.data.success, `Patient: ${seedRes.data.data?.patientName}`);
      testPatientId = seedRes.data.data?.patientId;
      testConsultationId = seedRes.data.data?.consultationId;
    } catch (e) {
      recordTest('SIH Demo Seeder: Seed Full Continuous Journey', false, e.message);
    }

    // 3. Screen 1: Auth & Demo Login
    try {
      const authRes = await axios.post(`${BASE_URL}/auth/demo-login`, { role: 'doctor' });
      doctorToken = authRes.data.token;
      recordTest('Screen 1: Authentication & Doctor Role Login', !!doctorToken, `User: ${authRes.data.user?.name}`);
    } catch (e) {
      recordTest('Screen 1: Authentication & Doctor Role Login', false, e.message);
    }

    // 4. Screen 2: Patient Registration & Intake
    try {
      const patRes = await axios.post(`${BASE_URL}/patients`, {
        name: 'Sunita Mehra',
        age: 48,
        gender: 'Female',
        phone: '+91 98111 22233',
        language: 'Hindi',
        bloodGroup: 'O+'
      });
      const createdPatient = patRes.data.data;
      
      const conRes = await axios.post(`${BASE_URL}/consultations`, {
        patientId: createdPatient.patientId,
        chiefComplaint: 'Mild chest tightness, breathlessness after climbing stairs, and occasional palpitations',
        vitals: { bpSystolic: 138, bpDiastolic: 88, pulse: 82, spO2: 97, temperature: 98.4 }
      });
      const createdCon = conRes.data.data;
      recordTest('Screen 2: Patient Kiosk Intake & Consultation Creation', !!createdCon.consultationId, `Encounter: ${createdCon.consultationId}`);
    } catch (e) {
      recordTest('Screen 2: Patient Kiosk Intake & Consultation Creation', false, e.message);
    }

    // 5. Screen 3: AI Interview Message Exchange
    try {
      const sesRes = await axios.post(`${BASE_URL}/interview/session`, { consultationId: testConsultationId });
      const msgRes = await axios.post(`${BASE_URL}/interview/message`, {
        consultationId: testConsultationId,
        text: 'The burning in my feet has been ongoing for 3 weeks and gets worse at night.',
        inputType: 'voice'
      });
      recordTest('Screen 3: AI Voice/Text Adaptive Interview & NLP Extraction', msgRes.data.success && !!msgRes.data.aiMessage, `Next Q Step: ${msgRes.data.stepIndex}`);
    } catch (e) {
      recordTest('Screen 3: AI Voice/Text Adaptive Interview & NLP Extraction', false, e.message);
    }

    // 6. Screen 4: Medical Document & OCR
    try {
      const docsRes = await axios.get(`${BASE_URL}/documents/consultation/${testConsultationId}`);
      recordTest('Screen 4: Medical Document Storage & OCR Extraction', docsRes.data.success && docsRes.data.count > 0, `Documents: ${docsRes.data.count}`);
    } catch (e) {
      recordTest('Screen 4: Medical Document Storage & OCR Extraction', false, e.message);
    }

    // 7. Screen 5: Multimodal Case Reconstruction
    try {
      const caseRes = await axios.post(`${BASE_URL}/cases/reconstruct/${testConsultationId}`);
      recordTest('Screen 5: Multimodal Clinical Case Reconstruction', caseRes.data.success && !!caseRes.data.data?.clinicalSummary, `Confidence: ${Math.round((caseRes.data.data?.confidenceScore || 0.9) * 100)}%`);
    } catch (e) {
      recordTest('Screen 5: Multimodal Clinical Case Reconstruction', false, e.message);
    }

    // 8. Screen 6: Evidence & Provenance Explorer
    try {
      const evRes = await axios.get(`${BASE_URL}/evidence/${testConsultationId}`);
      recordTest('Screen 6: Evidence Provenance & Traceability Graph', evRes.data.success && evRes.data.count > 0, `Linked Findings: ${evRes.data.count}`);
    } catch (e) {
      recordTest('Screen 6: Evidence Provenance & Traceability Graph', false, e.message);
    }

    // 9. Screen 7: Completeness Engine
    try {
      const compRes = await axios.get(`${BASE_URL}/completeness/${testConsultationId}`);
      recordTest('Screen 7: Case Completeness Engine Scoring', compRes.data.success && compRes.data.data?.overallPercentage >= 60, `Score: ${compRes.data.data?.overallPercentage}%`);
    } catch (e) {
      recordTest('Screen 7: Case Completeness Engine Scoring', false, e.message);
    }

    // 10. Screen 8: Patient Timeline
    try {
      const timeRes = await axios.get(`${BASE_URL}/timeline/${testPatientId}`);
      recordTest('Screen 8: Chronological Patient Journey Timeline', timeRes.data.success && timeRes.data.count >= 4, `Events: ${timeRes.data.count}`);
    } catch (e) {
      recordTest('Screen 8: Chronological Patient Journey Timeline', false, e.message);
    }

    // 11. Screen 9: AYUSH Assessment
    try {
      const ayushRes = await axios.get(`${BASE_URL}/ayush/${testConsultationId}`);
      recordTest('Screen 9: AYUSH Prakriti, Agni & Herbal Integration', ayushRes.data.success && !!ayushRes.data.data?.prakriti?.dominantDosha, `Dosha: ${ayushRes.data.data?.prakriti?.dominantDosha}`);
    } catch (e) {
      recordTest('Screen 9: AYUSH Prakriti, Agni & Herbal Integration', false, e.message);
    }

    // 12. Screen 10: Doctor Queue
    try {
      const queueRes = await axios.get(`${BASE_URL}/doctor/queue`);
      recordTest('Screen 10: Doctor Command Center & Triage Queue', queueRes.data.success && queueRes.data.count > 0, `Active Cases: ${queueRes.data.count}`);
    } catch (e) {
      recordTest('Screen 10: Doctor Command Center & Triage Queue', false, e.message);
    }

    // 13. Screen 11: Doctor Verification & Finalization
    try {
      const verRes = await axios.post(`${BASE_URL}/doctor/verify`, {
        consultationId: testConsultationId,
        findingId: 'test-finding-1',
        findingCategory: 'medication',
        findingKey: 'Metformin 500mg',
        previousValue: '500mg BD',
        verifiedValue: '500mg BD with meals',
        action: 'VERIFY',
        clinicalNotes: 'Verified compliant with glycemic guidelines.'
      }, { headers: { Authorization: `Bearer ${doctorToken}` } });

      const finalizeRes = await axios.post(`${BASE_URL}/doctor/finalize/${testConsultationId}`, {
        clinicalNotes: 'Physician comprehensive sign-off complete.'
      }, { headers: { Authorization: `Bearer ${doctorToken}` } });

      recordTest('Screen 11: Doctor Verification Action & Case Finalization', finalizeRes.data.success, 'Case Finalized & Locked');
    } catch (e) {
      recordTest('Screen 11: Doctor Verification Action & Case Finalization', false, e.message);
    }

    // 14. Screen 12: FHIR R4 Bundle & ABDM Compliance
    try {
      const fhirRes = await axios.get(`${BASE_URL}/fhir/${testConsultationId}`);
      const bundle = fhirRes.data.bundle;
      const isBundle = bundle?.resourceType === 'Bundle';
      const hasPatient = bundle?.entry?.some(e => e.resource?.resourceType === 'Patient');
      const hasComposition = bundle?.entry?.some(e => e.resource?.resourceType === 'Composition');
      const hasCondition = bundle?.entry?.some(e => e.resource?.resourceType === 'Condition');
      const hasObservation = bundle?.entry?.some(e => e.resource?.resourceType === 'Observation');

      const isCompliant = isBundle && hasPatient && hasComposition && hasCondition && hasObservation;
      recordTest('Screen 12: FHIR R4 Document Bundle & ABDM Structure Validation', isCompliant, `Resources: ${bundle?.entry?.length || 0}`);
    } catch (e) {
      recordTest('Screen 12: FHIR R4 Document Bundle & ABDM Structure Validation', false, e.message);
    }

  } catch (err) {
    console.error('Fatal Test Runner Error:', err);
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passedCount}/${totalCount} PASSED (${Math.round((passedCount/totalCount)*100)}%)`);
  console.log('======================================================\n');
}

runTests();
