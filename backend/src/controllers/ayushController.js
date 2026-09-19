const AYUSHAssessment = require('../models/AYUSHAssessment');
const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const { requestAyushAssessment } = require('../services/aiProxyService');
const { addTimelineEvent } = require('../services/timelineService');

// @desc Get or generate AYUSH assessment
// @route GET /api/ayush/:consultationId
const getAyushAssessment = async (req, res, next) => {
  try {
    const { consultationId } = req.params;

    let assessment = await AYUSHAssessment.findOne({ consultationId });
    if (!assessment) {
      const consultation = await Consultation.findOne({ consultationId }).populate('patient');
      if (!consultation) {
        return res.status(404).json({ success: false, message: 'Consultation not found' });
      }

      const patient = consultation.patient;

      // Generate initial assessment via AI engine
      const aiEval = await requestAyushAssessment({
        age: patient.age,
        gender: patient.gender,
        chiefComplaint: consultation.chiefComplaint,
        symptoms: [consultation.chiefComplaint],
        sleepPattern: "6 hours, restless",
        dietType: "Vegetarian",
        stressLevel: "Moderate"
      });

      assessment = await AYUSHAssessment.create({
        consultationId,
        patientId: patient.patientId,
        prakriti: aiEval.prakriti,
        vikriti: aiEval.vikriti,
        agni: aiEval.agni,
        dhatu: aiEval.dhatu,
        lifestyle: {
          sleepPattern: '6 hours, restless',
          sleepQuality: 'Disturbed',
          dietType: 'Vegetarian',
          appetite: 'Irregular',
          waterIntakeLiters: 2.0,
          physicalActivity: 'Sedentary',
          stressLevel: 'Moderate',
          bowelHabits: 'Regular'
        },
        aiSuggestions: {
          herbalRecommendations: aiEval.herbalRecommendations,
          dietaryAdvice: aiEval.dietaryAdvice,
          lifestyleModifications: aiEval.lifestyleModifications,
          contraindications: aiEval.contraindications
        }
      });
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

// @desc Save / Update AYUSH assessment
// @route POST /api/ayush/:consultationId
const saveAyushAssessment = async (req, res, next) => {
  try {
    const { consultationId } = req.params;
    const {
      prakriti,
      vikriti,
      agni,
      dashavidhaPariksha,
      koshta,
      dhatu,
      lifestyle,
      aiSuggestions,
      doctorAssessment
    } = req.body;

    const consultation = await Consultation.findOne({ consultationId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    let assessment = await AYUSHAssessment.findOne({ consultationId });
    if (!assessment) {
      assessment = new AYUSHAssessment({
        consultationId,
        patientId: consultation.patientId
      });
    }

    if (prakriti) assessment.prakriti = prakriti;
    if (vikriti) assessment.vikriti = vikriti;
    if (agni) assessment.agni = agni;
    if (dashavidhaPariksha) assessment.dashavidhaPariksha = dashavidhaPariksha;
    if (koshta) assessment.koshta = koshta;
    if (dhatu) assessment.dhatu = dhatu;
    if (lifestyle) assessment.lifestyle = lifestyle;
    if (aiSuggestions) assessment.aiSuggestions = aiSuggestions;
    if (doctorAssessment) assessment.doctorAssessment = doctorAssessment;

    await assessment.save();

    // Update completed steps
    if (!consultation.completedSteps.includes('AYUSH')) {
      consultation.completedSteps.push('AYUSH');
      await consultation.save();
    }

    // Add Timeline Event
    await addTimelineEvent({
      patientId: consultation.patientId,
      consultationId,
      eventType: 'AYUSH_ASSESSMENT',
      title: 'AYUSH Prakriti & Agni Assessment Logged',
      description: `Assessed Dominant Constitution: ${assessment.prakriti?.dominantDosha || 'Pitta-Vata'}, Agni: ${assessment.agni?.agniType || 'Tikshnagni'}. Classical Ayurvedic lifestyle & Ahara recommendations integrated.`,
      source: 'AYUSH_INTEGRATION_MODULE',
      badgeColor: 'amber'
    });

    res.json({
      success: true,
      message: 'AYUSH assessment saved successfully',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAyushAssessment,
  saveAyushAssessment
};
