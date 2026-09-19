const Evidence = require('../models/Evidence');

// @desc Get evidence items for a consultation
// @route GET /api/evidence/:consultationId
const getEvidenceByConsultation = async (req, res, next) => {
  try {
    const { consultationId } = req.params;
    const { category, sourceType, verificationStatus } = req.query;

    let query = { consultationId };
    if (category) query.findingCategory = category;
    if (sourceType) query.sourceType = sourceType;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const evidenceList = await Evidence.find(query).sort({ createdAt: -1 });

    // Grouping by source type
    const bySource = {
      PATIENT_INTERVIEW: evidenceList.filter(e => e.sourceType === 'PATIENT_INTERVIEW'),
      MEDICAL_DOCUMENT: evidenceList.filter(e => e.sourceType === 'MEDICAL_DOCUMENT'),
      OCR: evidenceList.filter(e => e.sourceType === 'OCR'),
      PATIENT_HISTORY: evidenceList.filter(e => e.sourceType === 'PATIENT_HISTORY'),
      DOCTOR_ENTERED: evidenceList.filter(e => e.sourceType === 'DOCTOR_ENTERED')
    };

    res.json({
      success: true,
      count: evidenceList.length,
      data: evidenceList,
      bySource
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update single evidence verification status
// @route PATCH /api/evidence/:id
const updateEvidenceStatus = async (req, res, next) => {
  try {
    const { verificationStatus, doctorNotes, findingValue } = req.body;
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence item not found' });
    }

    if (verificationStatus) evidence.verificationStatus = verificationStatus;
    if (doctorNotes !== undefined) evidence.doctorNotes = doctorNotes;
    if (findingValue !== undefined) evidence.findingValue = findingValue;

    await evidence.save();

    res.json({
      success: true,
      message: 'Evidence provenance updated',
      data: evidence
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvidenceByConsultation,
  updateEvidenceStatus
};
