const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const ClinicalCase = require('../models/ClinicalCase');
const Evidence = require('../models/Evidence');
const DoctorVerification = require('../models/DoctorVerification');
const AuditLog = require('../models/AuditLog');
const { addTimelineEvent } = require('../services/timelineService');

// @desc Get Doctor Queue with triage and completeness
// @route GET /api/doctor/queue
const getDoctorQueue = async (req, res, next) => {
  try {
    const consultations = await Consultation.find()
      .populate('patient')
      .sort({ createdAt: -1 })
      .limit(50);

    const enrichedQueue = await Promise.all(
      consultations.map(async (c) => {
        const pendingCount = await Evidence.countDocuments({
          consultationId: c.consultationId,
          verificationStatus: 'PENDING'
        });
        const verifiedCount = await Evidence.countDocuments({
          consultationId: c.consultationId,
          verificationStatus: { $in: ['VERIFIED', 'EDITED'] }
        });
        const clinicalCase = await ClinicalCase.findOne({ consultationId: c.consultationId });

        return {
          consultation: c,
          patient: c.patient,
          pendingVerificationCount: pendingCount,
          verifiedCount,
          hasReconstructedCase: !!clinicalCase,
          confidenceScore: clinicalCase?.confidenceScore || 0.88,
          priority: c.priority,
          status: c.status
        };
      })
    );

    res.json({
      success: true,
      count: enrichedQueue.length,
      data: enrichedQueue
    });
  } catch (error) {
    next(error);
  }
};

// @desc Submit single finding verification (VERIFY / EDIT / REJECT / ADD_NOTE)
// @route POST /api/doctor/verify
const submitVerification = async (req, res, next) => {
  try {
    const {
      consultationId,
      findingId = '',
      findingCategory,
      findingKey,
      previousValue,
      verifiedValue,
      action,
      clinicalNotes
    } = req.body;

    const doctorUser = req.user || {
      _id: 'demo-doctor-id-sih26047',
      name: 'Dr. Vikramaditya Sharma, MD',
      role: 'doctor'
    };

    if (!consultationId || !findingCategory || !findingKey || !action) {
      return res.status(400).json({
        success: false,
        message: 'consultationId, findingCategory, findingKey and action are required'
      });
    }

    const consultation = await Consultation.findOne({ consultationId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    // 1. Create DoctorVerification record
    const verification = await DoctorVerification.create({
      consultationId,
      patientId: consultation.patientId,
      doctorId: doctorUser._id,
      doctorName: doctorUser.name,
      findingId,
      findingCategory,
      findingKey,
      previousValue: previousValue || '',
      verifiedValue: verifiedValue || previousValue,
      action, // 'VERIFY', 'EDIT', 'REJECT', 'ADD_NOTE'
      clinicalNotes: clinicalNotes || ''
    });

    // 2. Update matching Evidence record
    let matchEvidence = await Evidence.findOne({
      consultationId,
      $or: [
        ...(typeof findingId === 'string' && /^[0-9a-fA-F]{24}$/.test(findingId) ? [{ _id: findingId }] : []),
        ...(findingKey ? [{ findingKey }] : [])
      ]
    });

    if (matchEvidence) {
      matchEvidence.verificationStatus = action === 'REJECT' ? 'REJECTED' : (action === 'EDIT' ? 'EDITED' : 'VERIFIED');
      if (verifiedValue) matchEvidence.findingValue = verifiedValue;
      if (clinicalNotes) matchEvidence.doctorNotes = clinicalNotes;
      await matchEvidence.save();
    }

    // 3. Log to Audit Trail
    await AuditLog.create({
      userId: doctorUser._id.toString(),
      userName: doctorUser.name,
      userRole: doctorUser.role || 'doctor',
      action: `DOCTOR_${action}_FINDING`,
      resourceType: 'Evidence',
      resourceId: findingId,
      details: {
        findingKey,
        previousValue,
        verifiedValue,
        action,
        clinicalNotes,
        consultationId
      }
    });

    // Update consultation status to under_review if intake/reconstructed
    if (consultation.status === 'reconstructed') {
      consultation.status = 'under_review';
      await consultation.save();
    }

    res.json({
      success: true,
      message: `Finding ${action.toLowerCase()} recorded successfully`,
      data: verification
    });
  } catch (error) {
    next(error);
  }
};

// @desc Finalize Clinical Case
// @route POST /api/doctor/finalize/:consultationId
const finalizeCase = async (req, res, next) => {
  try {
    const { consultationId } = req.params;
    const { clinicalNotes } = req.body;

    const doctorUser = req.user || {
      _id: 'demo-doctor-id-sih26047',
      name: 'Dr. Vikramaditya Sharma, MD',
      role: 'doctor'
    };

    if (!consultationId) {
      return res.status(400).json({
        success: false,
        message: 'consultationId is required'
      });
    }

    const consultation = await Consultation.findOne({ consultationId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    // Update Consultation
    consultation.status = 'finalized';
    if (!consultation.completedSteps.includes('VERIFICATION')) {
      consultation.completedSteps.push('VERIFICATION');
    }
    if (!consultation.completedSteps.includes('FINALIZED')) {
      consultation.completedSteps.push('FINALIZED');
    }
    await consultation.save();

    // Update ClinicalCase
    const clinicalCase = await ClinicalCase.findOne({ consultationId });
    if (clinicalCase) {
      clinicalCase.status = 'finalized';
      clinicalCase.isVerifiedByDoctor = true;
      await clinicalCase.save();
    }

    // Add Timeline Event
    await addTimelineEvent({
      patientId: consultation.patientId,
      consultationId,
      eventType: 'FINALIZED',
      title: `Case Finalized by ${doctorUser.name}`,
      description: `Physician completed comprehensive review. All clinical findings verified. Case unlocked for ABDM & FHIR R4 document exchange. ${clinicalNotes || ''}`,
      source: 'DOCTOR_VERIFIED',
      badgeColor: 'emerald'
    });

    // Audit Log
    await AuditLog.create({
      userId: doctorUser._id.toString(),
      userName: doctorUser.name,
      userRole: doctorUser.role || 'doctor',
      action: 'CASE_FINALIZATION',
      resourceType: 'Consultation',
      resourceId: consultationId,
      details: { finalizedAt: new Date(), notes: clinicalNotes }
    });

    res.json({
      success: true,
      message: 'Case finalized and verified for interoperability export',
      consultation
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get audit trail and verifications
// @route GET /api/doctor/audit-trail/:consultationId
const getAuditTrail = async (req, res, next) => {
  try {
    const { consultationId } = req.params;
    const verifications = await DoctorVerification.find({ consultationId }).sort({ createdAt: -1 });
    const auditLogs = await AuditLog.find({
      $or: [
        { resourceId: consultationId },
        { resourceType: 'Evidence', 'details.consultationId': consultationId }
      ]
    }).sort({ timestamp: -1 }).limit(100);

    res.json({
      success: true,
      verifications,
      auditLogs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorQueue,
  submitVerification,
  finalizeCase,
  getAuditTrail
};
