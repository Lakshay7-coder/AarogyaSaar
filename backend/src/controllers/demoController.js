const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');
const InterviewSession = require('../models/InterviewSession');
const InterviewMessage = require('../models/InterviewMessage');
const MedicalDocument = require('../models/MedicalDocument');
const OCRResult = require('../models/OCRResult');
const ClinicalCase = require('../models/ClinicalCase');
const Evidence = require('../models/Evidence');
const TimelineEvent = require('../models/TimelineEvent');
const AYUSHAssessment = require('../models/AYUSHAssessment');
const DoctorVerification = require('../models/DoctorVerification');
const AuditLog = require('../models/AuditLog');

/*
|--------------------------------------------------------------------------
| SEED SIH DEMO
|--------------------------------------------------------------------------
| Creates one complete AarogyaSaar SIH demo journey.
|
| IMPORTANT:
| Consultation.status  -> under_review
| ClinicalCase.status  -> in_review
|--------------------------------------------------------------------------
*/

const seedSihDemoPatient = async (req, res, next) => {
  try {
    // ============================================================
    // GENERATE NEXT DEMO ID
    // ============================================================

    const latestPatient = await Patient.findOne({
      patientId: {
        $regex: /^AS-PAT-2026-\d{4}$/
      }
    })
      .sort({ patientId: -1 })
      .lean();

    const latestConsultation = await Consultation.findOne({
      consultationId: {
        $regex: /^AS-CON-2026-\d{4}$/
      }
    })
      .sort({ consultationId: -1 })
      .lean();

    const latestPatientNumber = parseInt(
      latestPatient?.patientId?.slice(-4) || '0',
      10
    );

    const latestConsultationNumber = parseInt(
      latestConsultation?.consultationId?.slice(-4) || '0',
      10
    );

    const nextNumber =
      Math.max(
        latestPatientNumber,
        latestConsultationNumber
      ) + 1;

    const suffix = String(nextNumber).padStart(4, '0');

    const demoPatientId = `AS-PAT-2026-${suffix}`;
    const demoConsultationId = `AS-CON-2026-${suffix}`;

    // ============================================================
    // CLEAN GENERATED DEMO ID
    // ============================================================

    await Patient.deleteMany({
      patientId: demoPatientId
    });

    await Consultation.deleteMany({
      consultationId: demoConsultationId
    });

    await InterviewSession.deleteMany({
      consultationId: demoConsultationId
    });

    await InterviewMessage.deleteMany({
      consultationId: demoConsultationId
    });

    await MedicalDocument.deleteMany({
      consultationId: demoConsultationId
    });

    await OCRResult.deleteMany({
      consultationId: demoConsultationId
    });

    await ClinicalCase.deleteMany({
      consultationId: demoConsultationId
    });

    await Evidence.deleteMany({
      consultationId: demoConsultationId
    });

    await TimelineEvent.deleteMany({
      consultationId: demoConsultationId
    });

    await AYUSHAssessment.deleteMany({
      consultationId: demoConsultationId
    });

    await DoctorVerification.deleteMany({
      consultationId: demoConsultationId
    });

    await AuditLog.deleteMany({
      $or: [
        {
          resourceId: demoConsultationId
        },
        {
          'details.consultationId': demoConsultationId
        }
      ]
    });

    // ============================================================
    // 1. PATIENT
    // ============================================================

    const patient = await Patient.create({
      patientId: demoPatientId,

      name: 'Ramesh Kumar',

      age: 52,

      gender: 'Male',

      phone: '+91 98765 43210',

      email: 'ramesh.kumar@example.com',

      address:
        'B-42, Sector 14, Rohini, New Delhi 110085',

      language: 'Hindi',

      bloodGroup: 'B+',

      abhaId: '91-7892-4512-8921@sbx',

      emergencyContact: {
        name: 'Sunita Kumar',
        relationship: 'Spouse',
        phone: '+91 98765 43211'
      }
    });

    // ============================================================
    // 2. CONSULTATION
    // ============================================================
    // IMPORTANT:
    // Consultation model accepts "under_review"
    // NOT "in_review"
    // ============================================================

    const consultation = await Consultation.create({
      consultationId: demoConsultationId,

      patient: patient._id,

      patientId: demoPatientId,

      chiefComplaint:
        'Uncontrolled morning blood glucose (FBS > 165 mg/dL), polyuria, and burning tingling sensation in soles of feet for 3 weeks',

      duration: '3 weeks',

      consultationType: 'In-Person Outpatient',

      vitals: {
        bpSystolic: 142,
        bpDiastolic: 90,
        pulse: 78,
        temperature: 98.4,
        spO2: 98,
        weight: 74,
        height: 170,
        bmi: 25.6
      },

      priority: 'Urgent',

      consent: {
        given: true,
        givenAt: new Date(
          '2026-09-15T08:30:00+05:30'
        ),
        version: 'SIH-DEMO-CONSENT-v1',
        language: 'Hindi'
      },

      // CORRECT FOR CONSULTATION MODEL
      status: 'under_review',

      completedSteps: [
        'INTAKE',
        'INTERVIEW',
        'OCR',
        'RECONSTRUCTION',
        'AYUSH'
      ],

      notes:
        'Patient expresses concern regarding persistent foot paresthesia.'
    });

    // ============================================================
    // 3. INTERVIEW SESSION
    // ============================================================

    const session = await InterviewSession.create({
      consultationId: demoConsultationId,

      patientId: demoPatientId,

      status: 'completed',

      currentStepIndex: 6,

      totalStepsExpected: 6,

      language: 'Hindi'
    });

    // ============================================================
    // INTERVIEW MESSAGES
    // ============================================================

    const dialogue = [
      {
        sender: 'ai',

        text:
          'नमस्ते Ramesh Kumar जी। आपकी सुबह की blood sugar बढ़ी हुई है और पैरों के तलवों में जलन है। यह समस्या कब से है और क्या रात में बढ़ती है?',

        inputType: 'system'
      },

      {
        sender: 'patient',

        text:
          'पैरों के तलवों में जलन लगभग 3 हफ्तों से है। रात में लेटने के बाद यह काफी बढ़ जाती है और नींद आने में दिक्कत होती है।',

        inputType: 'voice'
      },

      {
        sender: 'ai',

        text:
          'समझ गया। क्या दिन में चक्कर, बहुत अधिक प्यास या बार-बार पेशाब आने जैसे दूसरे लक्षण भी हैं?',

        inputType: 'system'
      },

      {
        sender: 'patient',

        text:
          'हाँ, गला सूखने के कारण मैं 3 से 4 लीटर पानी पीता हूँ और रात में कम से कम दो बार पेशाब के लिए उठता हूँ।',

        inputType: 'voice'
      },

      {
        sender: 'ai',

        text:
          'धन्यवाद। आप रोज़ कौन सी prescription medicines या supplements लेते हैं? क्या किसी दवा से allergy है?',

        inputType: 'system'
      },

      {
        sender: 'patient',

        text:
          'मैं Metformin 500mg दिन में दो बार और BP के लिए Telmisartan 40mg सुबह एक बार लेता हूँ। मुझे किसी दवा से कोई allergy नहीं है।',

        inputType: 'text'
      },

      {
        sender: 'ai',

        text:
          'आपकी भूख, पाचन और stress कैसा है? क्या acidity, constipation या indigestion की समस्या है?',

        inputType: 'system'
      },

      {
        sender: 'patient',

        text:
          'भूख अच्छी है, लेकिन मसालेदार या oily dinner के बाद acidity और chest burning होती है। काम का stress भी हाल में काफी ज्यादा है।',

        inputType: 'voice'
      }
    ];

    for (const msg of dialogue) {
      await InterviewMessage.create({
        sessionId: session._id,

        consultationId: demoConsultationId,

        sender: msg.sender,

        text: msg.text,

        inputType: msg.inputType,

        confidence: 0.94
      });
    }

    // ============================================================
    // 4. MEDICAL DOCUMENT
    // ============================================================

    const doc = await MedicalDocument.create({
      consultationId: demoConsultationId,

      patientId: demoPatientId,

      originalFilename:
        'Apollo_Clinic_Outpatient_Prescription_Aug2026.pdf',

      storedFilename:
        'apollo_prescription_demo.pdf',

      fileUrl:
        '/uploads/apollo_prescription_demo.pdf',

      mimeType: 'application/pdf',

      fileSize: 428000,

      docType: 'prescription',

      ocrStatus: 'completed',

      extractedPreview:
        'Apollo Multispeciality Clinic - Outpatient Record. Diagnoses: Type 2 Diabetes Mellitus, Essential Hypertension. Rx: Metformin 500mg BD, Glimepiride 1mg OD, Telmisartan 40mg OD, Atorvastatin 10mg HS. HbA1c: 8.4%.'
    });

    // ============================================================
    // OCR RESULT
    // ============================================================

    await OCRResult.create({
      documentId: doc._id,

      consultationId: demoConsultationId,

      rawText: `
APOLLO MULTISPECIALITY CLINIC

Patient: Ramesh Kumar | Age: 52 Y / M | Date: 12-Aug-2026

Diagnosis:

1. Type 2 Diabetes Mellitus - Poor Glycemic Control
2. Essential Hypertension (Grade 1)
3. Dyslipidemia

Vitals: BP 142/90 mmHg, Pulse 78 bpm, SpO2 98%

Investigations:

- Fasting Blood Sugar: 168 mg/dL
- Postprandial Blood Sugar: 242 mg/dL
- HbA1c: 8.4%
- Total Cholesterol: 215 mg/dL

Rx:

1. Tab. Metformin 500 mg - 1 Tab twice daily
2. Tab. Glimepiride 1 mg - 1 Tab once daily
3. Tab. Telmisartan 40 mg - 1 Tab once daily
4. Tab. Atorvastatin 10 mg - 1 Tab once daily

Advised: Low glycemic diet, 30 min brisk walk.
Follow up in 6 weeks.
`,

      structuredFindings: {
        diagnoses: [
          'Type 2 Diabetes Mellitus',
          'Essential Hypertension',
          'Dyslipidemia'
        ],

        medications: [
          {
            name: 'Metformin',
            dosage: '500 mg',
            frequency: '1 Tab twice daily',
            duration: 'Ongoing'
          },

          {
            name: 'Glimepiride',
            dosage: '1 mg',
            frequency: '1 Tab once daily',
            duration: 'Ongoing'
          },

          {
            name: 'Telmisartan',
            dosage: '40 mg',
            frequency: '1 Tab once daily',
            duration: 'Ongoing'
          },

          {
            name: 'Atorvastatin',
            dosage: '10 mg',
            frequency: '1 Tab once daily',
            duration: 'Ongoing'
          }
        ],

        labResults: [
          {
            testName: 'Fasting Blood Sugar',
            value: '168',
            unit: 'mg/dL',
            referenceRange: '70 - 100',
            isAbnormal: true
          },

          {
            testName: 'Postprandial Blood Sugar',
            value: '242',
            unit: 'mg/dL',
            referenceRange: '< 140',
            isAbnormal: true
          },

          {
            testName: 'HbA1c',
            value: '8.4',
            unit: '%',
            referenceRange: '< 7.0',
            isAbnormal: true
          },

          {
            testName: 'Total Cholesterol',
            value: '215',
            unit: 'mg/dL',
            referenceRange: '< 200',
            isAbnormal: true
          }
        ],

        vitals: {
          bp: '142/90',
          pulse: '78',
          spo2: '98'
        }
      },

      confidenceScore: 0.95,

      engineUsed: 'PyMuPDF-ClinicalNLP',

      processingTimeMs: 180
    });

    // ============================================================
    // 5. CLINICAL CASE
    // ============================================================
    // IMPORTANT:
    // ClinicalCase model accepts "in_review"
    // ============================================================

    await ClinicalCase.create({
      consultationId: demoConsultationId,

      patientId: demoPatientId,

      chiefComplaint: consultation.chiefComplaint,

      clinicalSummary:
        'Ramesh Kumar, a 52-year-old male with established Type 2 Diabetes Mellitus and Essential Hypertension, presents with poorly controlled glycemic parameters alongside peripheral burning sensations in both feet.',

      symptoms: [
        {
          name: 'Peripheral Neuropathic Burning',
          duration: '3 weeks',
          severity: 'Moderate',
          frequency: 'Worse at night',
          source: 'PATIENT_INTERVIEW'
        },

        {
          name: 'Excess Thirst',
          duration: '3 weeks',
          severity: 'Moderate',
          frequency: 'Continuous',
          source: 'PATIENT_INTERVIEW'
        },

        {
          name: 'Frequent Night Urination',
          duration: '3 weeks',
          severity: 'Moderate',
          frequency: '2-3 times/night',
          source: 'PATIENT_INTERVIEW'
        },

        {
          name: 'Acid Reflux / Chest Burning',
          duration: 'Intermittent',
          severity: 'Mild',
          frequency: 'Post-prandial',
          source: 'PATIENT_INTERVIEW'
        }
      ],

      medications: [
        {
          name: 'Metformin',
          dosage: '500 mg',
          frequency: 'Twice daily',
          source: 'OCR_DOCUMENT',
          status: 'Active'
        },

        {
          name: 'Glimepiride',
          dosage: '1 mg',
          frequency: 'Once daily',
          source: 'OCR_DOCUMENT',
          status: 'Active'
        },

        {
          name: 'Telmisartan',
          dosage: '40 mg',
          frequency: 'Once daily',
          source: 'OCR_DOCUMENT',
          status: 'Active'
        },

        {
          name: 'Atorvastatin',
          dosage: '10 mg',
          frequency: 'Once daily',
          source: 'OCR_DOCUMENT',
          status: 'Active'
        }
      ],

      allergies: [
        {
          substance: 'No Known Drug Allergies',
          reaction: 'None',
          severity: 'None',
          source: 'PATIENT_INTERVIEW'
        }
      ],

      vitals: consultation.vitals,

      labFindings: [
        {
          testName: 'HbA1c',
          value: '8.4',
          unit: '%',
          referenceRange: '< 7.0',
          isAbnormal: true,
          source: 'OCR_DOCUMENT'
        },

        {
          testName: 'Fasting Blood Sugar',
          value: '168',
          unit: 'mg/dL',
          referenceRange: '70-100',
          isAbnormal: true,
          source: 'OCR_DOCUMENT'
        },

        {
          testName: 'Postprandial Blood Sugar',
          value: '242',
          unit: 'mg/dL',
          referenceRange: '< 140',
          isAbnormal: true,
          source: 'OCR_DOCUMENT'
        },

        {
          testName: 'Total Cholesterol',
          value: '215',
          unit: 'mg/dL',
          referenceRange: '< 200',
          isAbnormal: true,
          source: 'OCR_DOCUMENT'
        }
      ],

      previousDiagnoses: [
        {
          condition: 'Type 2 Diabetes Mellitus',
          diagnosedDate: '12-Aug-2026',
          source: 'OCR'
        },

        {
          condition: 'Essential Hypertension',
          diagnosedDate: '12-Aug-2026',
          source: 'OCR'
        },

        {
          condition: 'Dyslipidemia',
          diagnosedDate: '12-Aug-2026',
          source: 'OCR'
        }
      ],
unresolvedQuestions: [
  'Confirm medication timing and adherence.',
  'Consider physician-directed screening for diabetic complications.'
],
      

      contradictions: [],

      redFlags: [],

      confidenceScore: 0.94,

      isVerifiedByDoctor: false,

      // CORRECT FOR CLINICAL CASE MODEL
      status: 'in_review'
    });

    // ============================================================
    // 6. EVIDENCE
    // ============================================================

    const evidenceItems = [
      {
        findingCategory: 'symptom',

        findingKey:
          'Peripheral Burning in Soles',

        findingValue:
          '3 weeks duration, worse at night',

        sourceType: 'PATIENT_INTERVIEW',

        sourceName:
          'AI Voice Interview',

        sourceSnippet:
          'Patient reports burning in soles for approximately 3 weeks.',

        confidence: 0.96,

        verificationStatus: 'VERIFIED'
      },

      {
        findingCategory: 'lab',

        findingKey:
          'HbA1c: 8.4 %',

        findingValue:
          '8.4 %',

        sourceType: 'OCR',

        sourceName:
          'Apollo Clinic Prescription',

        sourceSnippet:
          'HbA1c: 8.4 %',

        confidence: 0.95,

        verificationStatus: 'VERIFIED'
      },

      {
        findingCategory: 'lab',

        findingKey:
          'Fasting Blood Sugar: 168 mg/dL',

        findingValue:
          '168 mg/dL',

        sourceType: 'OCR',

        sourceName:
          'Apollo Clinic Prescription',

        sourceSnippet:
          'Fasting Blood Sugar: 168 mg/dL',

        confidence: 0.95,

        verificationStatus: 'VERIFIED'
      },

      {
        findingCategory: 'medication',

        findingKey:
          'Metformin 500 mg',

        findingValue:
          'Twice daily',

        sourceType: 'OCR',

        sourceName:
          'Apollo Clinic Prescription',

        sourceSnippet:
          'Metformin 500 mg twice daily',

        confidence: 0.97,

        verificationStatus: 'VERIFIED'
      },

      {
        findingCategory: 'medication',

        findingKey:
          'Telmisartan 40 mg',

        findingValue:
          'Once daily',

        sourceType: 'OCR',

        sourceName:
          'Apollo Clinic Prescription',

        sourceSnippet:
          'Telmisartan 40 mg once daily',

        confidence: 0.96,

        verificationStatus: 'VERIFIED'
      },

      {
        findingCategory: 'vital',

        findingKey:
          'Blood Pressure: 142/90 mmHg',

        findingValue:
          '142/90 mmHg',

        sourceType: 'PATIENT_HISTORY',

        sourceName:
          'Kiosk Triage',

        sourceSnippet:
          'Blood pressure 142/90 mmHg',

        confidence: 0.98,

        verificationStatus: 'VERIFIED'
      },

      {
        findingCategory: 'allergy',

        findingKey:
          'No Known Drug Allergies',

        findingValue:
          'No known drug allergies reported',

        sourceType: 'PATIENT_INTERVIEW',

        sourceName:
          'AI Voice Interview',

        sourceSnippet:
          'Patient reports no known drug allergies.',

        confidence: 0.94,

        verificationStatus: 'VERIFIED'
      }
    ];

    for (const item of evidenceItems) {
      await Evidence.create({
        consultationId: demoConsultationId,

        patientId: demoPatientId,

        ...item
      });
    }

    // ============================================================
    // 7. AYUSH ASSESSMENT
    // ============================================================
await AYUSHAssessment.create({
  consultationId: demoConsultationId,
  patientId: demoPatientId,

  dashavidhaPariksha: {
    prakriti: 'Pitta-Vata',
    vikriti: 'Pitta-Vata tendency',
    sara: 'Madhyama',
    samhanana: 'Madhyama',
    pramana: 'Madhyama',
    satmya: 'Madhyama',
    satva: 'Madhyama',
    aharaShakti: 'Madhyama',
    vyayamaShakti: 'Madhyama',
    vaya: 'Madhyama (30-60 years)'
  },

  prakriti: {
    vata: 35,
    pitta: 45,
    kapha: 20,
    dominantDosha: 'Pitta-Vata'
  },

  vikriti: {
    currentImbalance:
      'Pitta-Vata tendency with metabolic imbalance',
    severity: 'Moderate'
  },

  agni: {
    agniType: 'Tikshnagni (Intense/Pitta)',
    description:
      'Reported digestive burning and post-prandial discomfort.'
  },

  koshta: 'Madhyama (Medium/Kapha)',

  dhatu: [
    'Rasa',
    'Rakta',
    'Meda'
  ],

  lifestyle: {
    sleepPattern:
      '6 hours, restless sleep',
    sleepQuality:
      'Disturbed',
    dietType:
      'Vegetarian',
    appetite:
      'Irregular',
    waterIntakeLiters:
      3.5,
    physicalActivity:
      'Sedentary',
    stressLevel:
      'High',
    bowelHabits:
      'Regular'
  },

  aiSuggestions: {
    herbalRecommendations: [],
    dietaryAdvice: [
      'Discuss balanced diet with treating physician/dietitian.',
      'Avoid meals that consistently worsen digestive symptoms.'
    ],
    lifestyleModifications: [
      'Discuss appropriate physical activity with treating clinician.',
      'Maintain regular sleep and meal timing.'
    ],
    contraindications: []
  },

  doctorAssessment: {
    verifiedDosha:
      'Pitta-Vata',
    clinicalNotes:
      'AYUSH assessment is supportive information and requires physician review.',
    prescribedAyushRegimen: [],
    isVerified: false,
    verifiedBy: null,
    verifiedAt: null
  }
});
  
    // ============================================================
    // 8. TIMELINE
    // ============================================================

    const events = [
      {
        eventType: 'INTAKE',

        title:
          'Kiosk Registration & Vital Signs Check-in',

        description:
          'Patient registered and initial vitals captured.',

        source:
          'PATIENT_KIOSK',

        badgeColor:
          'emerald',

        offsetMin:
          45
      },

      {
        eventType: 'INTERVIEW',

        title:
          'Adaptive AI Voice Interview Completed',

        description:
          'Clinical interview completed and symptoms captured.',

        source:
          'AI_CLINICAL_INTERVIEWER',

        badgeColor:
          'teal',

        offsetMin:
          35
      },

      {
        eventType: 'DOCUMENT_UPLOAD',

        title:
          'Prescription Uploaded & OCR Scanned',

        description:
          'Medical prescription processed through OCR.',

        source:
          'OCR_SERVICE',

        badgeColor:
          'blue',

        offsetMin:
          25
      },

      {
        eventType: 'RECONSTRUCTION',

        title:
          'Multimodal Case Reconstruction Generated',

        description:
          'Clinical information unified into a structured case.',

        source:
          'AI_RECONSTRUCTION_ENGINE',

        badgeColor:
          'purple',

        offsetMin:
          15
      },

      {
        eventType: 'AYUSH_ASSESSMENT',

        title:
          'AYUSH Prakriti & Agni Assessment Logged',

        description:
          'Supportive AYUSH assessment information recorded.',

        source:
          'AYUSH_INTEGRATION_MODULE',

        badgeColor:
          'amber',

        offsetMin:
          10
      },

      {
        eventType: 'DOCTOR_VERIFIED',

        title:
          'Clinical Findings Ready for Physician Verification',

        description:
          'Case is available for physician review and verification.',

        source:
          'DOCTOR_VERIFICATION',

        badgeColor:
          'indigo',

        offsetMin:
          2
      }
    ];

    for (const ev of events) {
      await TimelineEvent.create({
        patientId: demoPatientId,

        consultationId:
          demoConsultationId,

        eventType:
          ev.eventType,

        title:
          ev.title,

        description:
          ev.description,

        source:
          ev.source,

        badgeColor:
          ev.badgeColor,

        timestamp:
          new Date(
            Date.now() -
            ev.offsetMin * 60 * 1000
          )
      });
    }

    // ============================================================
    // SUCCESS RESPONSE
    // ============================================================

    return res.status(201).json({
      success: true,

      message:
        'SIH26047 demo patient seeded successfully.',

      data: {
        patientId:
          demoPatientId,

        consultationId:
          demoConsultationId,

        patientName:
          patient.name,

        consultationStatus:
          consultation.status,

        clinicalCaseStatus:
          'in_review'
      }
    });

  } catch (error) {
    console.error(
      '[Demo Seed Error]:',
      error
    );

    next(error);
  }
};

// ================================================================
// RESET DEMO DATA
// ================================================================

const resetDemoData = async (req, res, next) => {
  try {
    // ------------------------------------------------------------
    // Find all SIH demo patients
    // ------------------------------------------------------------

    const demoPatients =
      await Patient.find({
        patientId: {
          $regex:
            /^AS-PAT-2026-\d{4}$/
        }
      })
        .select('patientId')
        .lean();

    const patientIds =
      demoPatients.map(
        (patient) =>
          patient.patientId
      );

    // ------------------------------------------------------------
    // Find all SIH demo consultations
    // ------------------------------------------------------------

    const demoConsultations =
      await Consultation.find({
        consultationId: {
          $regex:
            /^AS-CON-2026-\d{4}$/
        }
      })
        .select('consultationId')
        .lean();

    const consultationIds =
      demoConsultations.map(
        (consultation) =>
          consultation.consultationId
      );

    // ------------------------------------------------------------
    // Delete patient data
    // ------------------------------------------------------------

    if (patientIds.length > 0) {
      await Patient.deleteMany({
        patientId: {
          $in: patientIds
        }
      });
    }

    // ------------------------------------------------------------
    // Delete consultation-dependent data
    // ------------------------------------------------------------

    if (consultationIds.length > 0) {
      const filter = {
        consultationId: {
          $in: consultationIds
        }
      };

      await Consultation.deleteMany(
        filter
      );

      await InterviewSession.deleteMany(
        filter
      );

      await InterviewMessage.deleteMany(
        filter
      );

      await MedicalDocument.deleteMany(
        filter
      );

      await OCRResult.deleteMany(
        filter
      );

      await ClinicalCase.deleteMany(
        filter
      );

      await Evidence.deleteMany(
        filter
      );

      await TimelineEvent.deleteMany(
        filter
      );

      await AYUSHAssessment.deleteMany(
        filter
      );

      await DoctorVerification.deleteMany(
        filter
      );

      await AuditLog.deleteMany({
        $or: [
          {
            resourceId: {
              $in: consultationIds
            }
          },

          {
            'details.consultationId': {
              $in: consultationIds
            }
          }
        ]
      });
    }

    return res.json({
      success: true,

      message:
        'AarogyaSaar SIH demo data reset successfully.',

      deleted: {
        patients:
          patientIds.length,

        consultations:
          consultationIds.length
      }
    });

  } catch (error) {
    console.error(
      '[Demo Reset Error]:',
      error
    );

    next(error);
  }
};

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  seedSihDemoPatient,
  resetDemoData
};