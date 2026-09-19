const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const { addTimelineEvent } = require('../services/timelineService');

// @desc Create new consultation
// @route POST /api/consultations
const createConsultation = async (req, res, next) => {
  try {
    const {
      patientId,
      chiefComplaint,
      duration,
      consultationType,
      vitals,
      priority,
      notes,
      consent
    } = req.body;

    if (!consent?.given) {
      return res.status(400).json({
        success: false,
        message:
          'Patient consent is required before starting the AI-assisted case-taking workflow.'
      });
    }

    const patient = await Patient.findOne({ patientId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient with this ID does not exist'
      });
    }

    // Generate a fresh consultation ID.
    // Do not use countDocuments() + 1 because existing records
    // can cause duplicate IDs.
    const year = new Date().getFullYear();

    let consultationId;
    let exists = true;

    while (exists) {
      const randomNumber = Math.floor(1000 + Math.random() * 9000);

      consultationId = `AS-CON-${year}-${randomNumber}`;

      exists = await Consultation.exists({
        consultationId
      });
    }

    const consultation = await Consultation.create({
      consultationId,
      patient: patient._id,
      patientId: patient.patientId,

      chiefComplaint,

      duration: duration || 'A few days',

      consultationType:
        consultationType || 'In-Person Outpatient',

      vitals: vitals || {},

      priority: priority || 'Routine',

      notes: notes || '',

      consent: {
        given: true,
        givenAt: consent.givenAt
          ? new Date(consent.givenAt)
          : new Date(),
        version:
          consent.version || 'SIH-DEMO-CONSENT-v1',
        language:
          consent.language || 'English'
      },

      status: 'intake',

      completedSteps: ['INTAKE']
    });

    /*
     * Do NOT create a CONSENT timeline event here.
     *
     * TimelineEvent.js does not currently allow:
     * eventType: 'CONSENT'
     *
     * Consent is already stored in the consultation record.
     */

    await addTimelineEvent({
      patientId: patient.patientId,
      consultationId: consultation.consultationId,
      eventType: 'INTAKE',
      title: 'Clinical Intake & Kiosk Check-in',
      description:
        `Patient checked in with chief complaint: "${chiefComplaint}". ` +
        `Baseline vitals recorded (BP: ${vitals?.bpSystolic || 120}/` +
        `${vitals?.bpDiastolic || 80} mmHg, Pulse: ${vitals?.pulse || 72} bpm, ` +
        `SpO2: ${vitals?.spO2 || 98}%).`,
      source: 'PATIENT_KIOSK',
      badgeColor: 'emerald'
    });

    return res.status(201).json({
      success: true,
      message: 'Consultation initiated successfully',
      data: consultation
    });

  } catch (error) {

    if (error?.code === 11000) {
      console.warn(
        '[Consultation] Duplicate consultation ID generated. Please retry.'
      );

      return res.status(409).json({
        success: false,
        message:
          'A unique consultation ID could not be generated. Please retry.'
      });
    }

    next(error);
  }
};


// @desc Get all consultations
// @route GET /api/consultations
const getConsultations = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      patientId
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (patientId) {
      query.patientId = patientId;
    }

    const consultations = await Consultation.find(query)
      .populate(
        'patient',
        'name age gender phone abhaId bloodGroup'
      )
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      count: consultations.length,
      data: consultations
    });

  } catch (error) {
    next(error);
  }
};


// @desc Get consultation by ID
// @route GET /api/consultations/:id
const getConsultationById = async (req, res, next) => {
  try {
    const param = req.params.id;

    let consultation = await Consultation
      .findOne({ consultationId: param })
      .populate('patient');

    if (
      !consultation &&
      param.match(/^[0-9a-fA-F]{24}$/)
    ) {
      consultation = await Consultation
        .findById(param)
        .populate('patient');
    }

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found'
      });
    }

    return res.json({
      success: true,
      data: consultation
    });

  } catch (error) {
    next(error);
  }
};


// @desc Update consultation status
// @route PATCH /api/consultations/:id/status
const updateConsultationStatus = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      step
    } = req.body;

    const consultation = await Consultation.findOne({
      consultationId: req.params.id
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    if (status) {
      consultation.status = status;
    }

    if (
      step &&
      !consultation.completedSteps.includes(step)
    ) {
      consultation.completedSteps.push(step);
    }

    await consultation.save();

    return res.json({
      success: true,
      data: consultation
    });

  } catch (error) {
    next(error);
  }
};


// IMPORTANT: Export all four handlers.
module.exports = {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus
};