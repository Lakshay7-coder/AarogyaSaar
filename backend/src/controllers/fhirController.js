const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');
const ClinicalCase = require('../models/ClinicalCase');
const Evidence = require('../models/Evidence');
const MedicalDocument = require('../models/MedicalDocument');
const AYUSHAssessment = require('../models/AYUSHAssessment');
const DoctorVerification = require('../models/DoctorVerification');
const { generateFhirBundle } = require('../services/fhirService');

// @desc Generate FHIR R4 Bundle
// @route GET /api/fhir/:consultationId
const getFhirRecord = async (req, res, next) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findOne({ consultationId }).populate('patient');
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const patient = consultation.patient;
    const clinicalCase = await ClinicalCase.findOne({ consultationId });
    const evidenceList = await Evidence.find({ consultationId });
    const documents = await MedicalDocument.find({ consultationId });
    const ayushAssessment = await AYUSHAssessment.findOne({ consultationId });
    const doctorVerifications = await DoctorVerification.find({ consultationId });

    const fhirBundle = generateFhirBundle({
      patient,
      consultation,
      clinicalCase,
      evidenceList,
      documents,
      ayushAssessment,
      doctor: req.user,
      doctorVerifications
    });

    res.json({
      success: true,
      bundleId: fhirBundle.id,
      standard: 'HL7 FHIR R4 & ABDM HIP Profile',
      isVerifiedOnly: consultation.status === 'finalized',
      bundle: fhirBundle
    });
  } catch (error) {
    next(error);
  }
};

// @desc Download FHIR JSON bundle
// @route GET /api/fhir/download/:consultationId
const downloadFhirBundle = async (req, res, next) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findOne({ consultationId }).populate('patient');
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const patient = consultation.patient;
    const clinicalCase = await ClinicalCase.findOne({ consultationId });
    const evidenceList = await Evidence.find({ consultationId });
    const documents = await MedicalDocument.find({ consultationId });
    const ayushAssessment = await AYUSHAssessment.findOne({ consultationId });
    const doctorVerifications = await DoctorVerification.find({ consultationId });

    const fhirBundle = generateFhirBundle({
      patient,
      consultation,
      clinicalCase,
      evidenceList,
      documents,
      ayushAssessment,
      doctor: req.user,
      doctorVerifications
    });

    const jsonString = JSON.stringify(fhirBundle, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=FHIR_BUNDLE_${consultationId}.json`);
    res.send(jsonString);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFhirRecord,
  downloadFhirBundle
};
