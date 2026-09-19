const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const InterviewMessage = require('../models/InterviewMessage');
const MedicalDocument = require('../models/MedicalDocument');
const AYUSHAssessment = require('../models/AYUSHAssessment');
const DoctorVerification = require('../models/DoctorVerification');
const { requestCompleteness } = require('../services/aiProxyService');

// @desc Get case completeness score and missing items
// @route GET /api/completeness/:consultationId
const getCompleteness = async (req, res, next) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findOne({ consultationId }).populate('patient');
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const patient = consultation.patient;
    const interviewHistory = await InterviewMessage.find({ consultationId });
    const documents = await MedicalDocument.find({ consultationId });
    const ayushAssessment = await AYUSHAssessment.findOne({ consultationId });
    const doctorVerifications = await DoctorVerification.find({ consultationId });

    const result = await requestCompleteness({
      patient: patient.toObject ? patient.toObject() : patient,
      consultation: consultation.toObject ? consultation.toObject() : consultation,
      interviewHistory: interviewHistory.map(m => ({ sender: m.sender, text: m.text })),
      documents: documents.map(d => ({ filename: d.originalFilename, status: d.ocrStatus })),
      ayushAssessment: ayushAssessment ? (ayushAssessment.toObject ? ayushAssessment.toObject() : ayushAssessment) : null,
      doctorVerification: doctorVerifications.length > 0 ? { count: doctorVerifications.length } : null
    });

    res.json({
      success: true,
      consultationId,
      patientId: patient.patientId,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCompleteness };
