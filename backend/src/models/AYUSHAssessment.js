const mongoose = require('mongoose');

const ayushAssessmentSchema = new mongoose.Schema({
  consultationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientId: {
    type: String,
    required: true,
    index: true
  },
  prakriti: {
    vata: { type: Number, default: 35 },
    pitta: { type: Number, default: 45 },
    kapha: { type: Number, default: 20 },
    dominantDosha: { type: String, default: 'Pitta-Vata' }
  },
  vikriti: {
    currentImbalance: { type: String, default: 'Pitta Vriddhi with Vata involvement' },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], default: 'Moderate' }
  },
  agni: {
    agniType: {
      type: String,
      enum: ['Samagni (Balanced)', 'Vishamagni (Irregular/Vata)', 'Tikshnagni (Intense/Pitta)', 'Mandagni (Sluggish/Kapha)'],
      default: 'Tikshnagni (Intense/Pitta)'
    },
    description: { type: String, default: 'Hyper-metabolic tendency with irregular digestion' }
  },
  dashavidhaPariksha: {
    prakriti: { type: String, default: 'Pitta-Vata' },
    vikriti: { type: String, default: 'Pitta-Vata tendency' },
    sara: { type: String, default: 'Madhyama' },
    samhanana: { type: String, default: 'Madhyama' },
    pramana: { type: String, default: 'Madhyama' },
    satmya: { type: String, default: 'Madhyama' },
    satva: { type: String, default: 'Madhyama' },
    aharaShakti: { type: String, default: 'Madhyama' },
    vyayamaShakti: { type: String, default: 'Madhyama' },
    vaya: { type: String, default: 'Madhyama (30-60 years)' }
  },
  koshta: {
    type: String,
    enum: ['Mrudu (Soft/Pitta)', 'Madhyama (Medium/Kapha)', 'Krura (Hard/Vata)'],
    default: 'Madhyama (Medium/Kapha)'
  },
  dhatu: [{ type: String }],
  lifestyle: {
    sleepPattern: { type: String, default: '6 hours, restless' },
    sleepQuality: { type: String, enum: ['Poor', 'Disturbed', 'Good', 'Sound'], default: 'Disturbed' },
    dietType: { type: String, enum: ['Vegetarian', 'Non-Vegetarian', 'Ovo-Vegetarian', 'Vegan'], default: 'Vegetarian' },
    appetite: { type: String, default: 'Irregular' },
    waterIntakeLiters: { type: Number, default: 2.0 },
    physicalActivity: { type: String, default: 'Sedentary' },
    stressLevel: { type: String, enum: ['Low', 'Moderate', 'High', 'Severe'], default: 'Moderate' },
    bowelHabits: { type: String, default: 'Regular' }
  },
  aiSuggestions: {
    herbalRecommendations: [{
      herb: String,
      indication: String,
      classicalRef: String
    }],
    dietaryAdvice: [{ type: String }],
    lifestyleModifications: [{ type: String }],
    contraindications: [{ type: String }]
  },
  doctorAssessment: {
    verifiedDosha: { type: String, default: '' },
    clinicalNotes: { type: String, default: '' },
    prescribedAyushRegimen: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: String, default: '' },
    verifiedAt: { type: Date }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AYUSHAssessment', ayushAssessmentSchema);
