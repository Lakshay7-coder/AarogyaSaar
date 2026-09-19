const Patient = require('../models/Patient');
const { addTimelineEvent } = require('../services/timelineService');

// @desc Create new patient
// @route POST /api/patients
const createPatient = async (req, res, next) => {
  try {
    const { name, age, dateOfBirth, gender, phone, email, address, language, bloodGroup, emergencyContact } = req.body;

    const count = await Patient.countDocuments();
    const patientId = `AS-PAT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const patient = await Patient.create({
      patientId,
      name,
      age: Number(age),
      dateOfBirth,
      gender,
      phone,
      email: email || '',
      address: address || '',
      language: language || 'English',
      bloodGroup: bloodGroup || 'Unknown',
      emergencyContact: emergencyContact || {}
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all patients
// @route GET /api/patients
const getPatients = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get patient by ID
// @route GET /api/patients/:id
const getPatientById = async (req, res, next) => {
  try {
    const param = req.params.id;
    let patient = await Patient.findOne({ patientId: param });
    if (!patient && param.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(param);
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById
};
