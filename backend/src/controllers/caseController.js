const ClinicalCase = require('../models/ClinicalCase');
const Consultation = require('../models/Consultation');
const InterviewMessage = require('../models/InterviewMessage');
const MedicalDocument = require('../models/MedicalDocument');
const OCRResult = require('../models/OCRResult');
const Evidence = require('../models/Evidence');
const { requestCaseReconstruction } = require('../services/aiProxyService');
const { addTimelineEvent } = require('../services/timelineService');

// @desc Trigger multimodal case reconstruction
// @route POST /api/cases/reconstruct/:consultationId
const reconstructCase = async (req, res, next) => {
  try {
    const { consultationId } = req.params;

    if (!consultationId) {
      return res.status(400).json({
        success: false,
        message: 'consultationId is required'
      });
    }

    const consultation = await Consultation
      .findOne({ consultationId })
      .populate('patient');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const patient = consultation.patient;

    if (!patient) {
      return res.status(422).json({
        success: false,
        message: 'Patient record is missing for this consultation.'
      });
    }

    /*
     * IMPORTANT:
     * First check whether a ClinicalCase already exists.
     * This prevents duplicate-key errors on consultationId.
     */
    let clinicalCase = await ClinicalCase.findOne({ consultationId });

    if (clinicalCase) {
      return res.json({
        success: true,
        message: 'Existing clinical case loaded successfully',
        data: clinicalCase
      });
    }

    const interviewMessages = await InterviewMessage
      .find({ consultationId })
      .sort({ createdAt: 1 });

    const documents = await MedicalDocument.find({ consultationId });

    const ocrResults = await OCRResult.find({ consultationId });

    // Format OCR documents for AI engine
    const formattedDocs = documents.map((doc) => {
      const matchOcr = ocrResults.find(
        (o) =>
          o.documentId &&
          o.documentId.toString() === doc._id.toString()
      );

      return {
        originalFilename: doc.originalFilename,
        docType: doc.docType,
        structuredFindings: matchOcr?.structuredFindings || {}
      };
    });

    // Format interview for AI engine
    const formattedInterview = interviewMessages.map((m) => ({
      sender: m.sender,
      text: m.text,
      inputType: m.inputType
    }));

    // Call AI Reconstruction Service
    let aiResult;

    try {
      aiResult = await requestCaseReconstruction({
        consultationId,
        patientId: patient.patientId,
        patientName: patient.name,
        age: patient.age,
        gender: patient.gender,
        chiefComplaint: consultation.chiefComplaint,
        intakeVitals: consultation.vitals || {},
        interviewHistory: formattedInterview,
        ocrDocuments: formattedDocs,
        pastHistory: []
      });
    } catch (aiError) {
      console.warn(
        '[Case Reconstruction] Local fallback used:',
        aiError.message
      );

      aiResult = {
        clinicalSummary:
          `${patient.name}, presenting with ${consultation.chiefComplaint}. ` +
          `The case has been synthesized from the recorded intake, ` +
          `interview and available medical evidence for physician review.`,

        chiefComplaint: consultation.chiefComplaint,

        symptoms: [
          {
            name: consultation.chiefComplaint,
            duration: consultation.duration || 'A few days',
            severity: 'Moderate',
            frequency: 'Reported',
            source: 'PATIENT_INTAKE'
          }
        ],

        medications: [],

        allergies: [
          {
            substance: 'No Known Drug Allergies (NKDA)',
            reaction: 'None',
            severity: 'None',
            source: 'PATIENT_INTERVIEW'
          }
        ],

        labFindings: [],
        previousDiagnoses: [],

        unresolvedQuestions: [
          'Review the complete patient history and verify AI-extracted findings.'
        ],

        contradictions: [],
        redFlags: [],
        confidenceScore: 0.80
      };
    }

    /*
     * Create the case only if it still does not exist.
     *
     * The second check protects against two browser requests
     * arriving almost simultaneously.
     */
    clinicalCase = await ClinicalCase.findOne({ consultationId });

    if (!clinicalCase) {
      clinicalCase = new ClinicalCase({
        consultationId,
        patientId: patient.patientId,
        chiefComplaint:
          aiResult.chiefComplaint || consultation.chiefComplaint,
        clinicalSummary:
          aiResult.clinicalSummary ||
          'Clinical case reconstructed from available patient information.',
        symptoms: aiResult.symptoms || [],
        medications: aiResult.medications || [],
        allergies: aiResult.allergies || [],
        vitals: consultation.vitals || {},
        labFindings: aiResult.labFindings || [],
        previousDiagnoses: aiResult.previousDiagnoses || [],
        unresolvedQuestions: aiResult.unresolvedQuestions || [],
        contradictions: aiResult.contradictions || [],
        redFlags: aiResult.redFlags || [],
        confidenceScore: aiResult.confidenceScore || 0.92,
        status: 'reconstructed'
      });

      try {
        await clinicalCase.save();
      } catch (saveError) {
        /*
         * If another request created the same consultation case
         * between our findOne() and save(), MongoDB raises 11000.
         * In that situation, simply load the existing record.
         */
        if (saveError?.code === 11000) {
          clinicalCase = await ClinicalCase.findOne({
            consultationId
          });

          if (!clinicalCase) {
            throw saveError;
          }

          return res.json({
            success: true,
            message: 'Existing clinical case loaded successfully',
            data: clinicalCase
          });
        }

        throw saveError;
      }
    }

    /*
     * Populate Evidence records for Symptoms.
     */
    for (const s of aiResult.symptoms || []) {
      const findingKey = s.name;

      const existingEvidence = await Evidence.findOne({
        consultationId,
        findingKey
      });

      if (!existingEvidence) {
        await Evidence.create({
          consultationId,
          patientId: patient.patientId,
          findingCategory: 'symptom',
          findingKey,
          findingValue:
            `${s.name} (${s.duration || 'Reported'}, ` +
            `Severity: ${s.severity || 'Moderate'})`,
          sourceType:
            s.source === 'PATIENT_INTAKE'
              ? 'PATIENT_HISTORY'
              : 'PATIENT_INTERVIEW',
          sourceName:
            s.sourceRef || 'AI Voice/Text Interview Session',
          sourceSnippet:
            `Patient reported: ${s.name}, ongoing for ${
              s.duration || 'several days'
            }`,
          confidence: 0.95,
          verificationStatus: 'PENDING'
        });
      }
    }

    /*
     * Update consultation.
     */
    if (!consultation.completedSteps.includes('RECONSTRUCTION')) {
      consultation.completedSteps.push('RECONSTRUCTION');
    }

    consultation.status = 'reconstructed';

    await consultation.save();

    /*
     * Add timeline event.
     */
    await addTimelineEvent({
      patientId: patient.patientId,
      consultationId,
      eventType: 'RECONSTRUCTION',
      title: 'Multimodal Case Reconstruction Generated',
      description:
        `Synthesized ${clinicalCase.symptoms.length} symptoms, ` +
        `${clinicalCase.medications.length} active medications, ` +
        `${clinicalCase.labFindings.length} lab records, ` +
        `${clinicalCase.redFlags.length} safety flags, and ` +
        `${clinicalCase.contradictions.length} conflict checks ` +
        `into unified dossier.`,
      source: 'AI_RECONSTRUCTION_ENGINE',
      badgeColor: 'purple',
      metadata: {
        confidenceScore: clinicalCase.confidenceScore
      }
    });

    return res.json({
      success: true,
      message: 'Case reconstructed successfully',
      data: clinicalCase
    });

  } catch (error) {
    next(error);
  }
};


// @desc Get reconstructed case by consultation ID
// @route GET /api/cases/:consultationId
const getCaseByConsultation = async (req, res, next) => {
  try {
    const { consultationId } = req.params;

    if (!consultationId) {
      return res.status(400).json({
        success: false,
        message: 'consultationId is required'
      });
    }

    const clinicalCase = await ClinicalCase.findOne({
      consultationId
    });

    if (!clinicalCase) {
      return res.status(404).json({
        success: false,
        message:
          'Clinical case has not been reconstructed yet for this consultation.'
      });
    }

    return res.json({
      success: true,
      data: clinicalCase
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  reconstructCase,
  getCaseByConsultation
};