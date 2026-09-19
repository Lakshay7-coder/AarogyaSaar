import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import { savePatientLanguage, usePatientLanguage, t } from '../patientI18n';
import {
  ClipboardList,
  User,
  Heart,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Scale
} from 'lucide-react';

const PatientIntakePage = () => {
  const navigate = useNavigate();
  const { setActiveCase } = useCase();
  const uiLanguage = usePatientLanguage('English');

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    language: 'English',
    bloodGroup: 'B+',
    chiefComplaint: '',
    duration: '3-5 days',
    consultationType: 'In-Person Outpatient',
    priority: 'Routine',
    vitals: {
      bpSystolic: 120,
      bpDiastolic: 80,
      pulse: 74,
      temperature: 98.6,
      spO2: 98,
      weight: 68,
      height: 170
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const changeLanguage = (language) => {
    setFormData((prev) => ({ ...prev, language }));
    savePatientLanguage(language);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVitalChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [field]: Number(val) }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!consentGiven) {
      setError(t(uiLanguage, 'errorStart'));
      return;
    }

    setLoading(true);

    try {
      // 1. Create Patient
      const patRes = await api.post('/patients', {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        language: formData.language,
        bloodGroup: formData.bloodGroup
      });

      const newPatient = patRes.data.data;

      // 2. Create Consultation
      const conRes = await api.post('/consultations', {
        patientId: newPatient.patientId,
        chiefComplaint: formData.chiefComplaint,
        duration: formData.duration,
        consultationType: formData.consultationType,
        priority: formData.priority,
        vitals: formData.vitals,
        consent: {
          given: true,
          givenAt: new Date().toISOString(),
          version: 'SIH-DEMO-CONSENT-v1',
          language: formData.language
        }
      });

      const newConsultation = conRes.data.data;

      // Set in context
      setActiveCase(newConsultation.consultationId, newPatient.patientId);
      setSuccessResult({ patient: newPatient, consultation: newConsultation });
      savePatientLanguage(formData.language);
    } catch (err) {
      console.error('Failed to submit patient intake:', err);
      setError(uiLanguage === 'Hindi' ? 'जानकारी जमा करने में समस्या हुई। कृपया अपनी जानकारी जाँचकर फिर कोशिश करें।' : (err.response?.data?.message || err.message || 'Failed to submit patient intake'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-kiosk max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Patient-first language selection */}
      <div className="mb-6 rounded-2xl border-2 border-ayur-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ayur-700 mb-1">{t(uiLanguage, 'patientJourney')}</div>
            <h2 className="text-xl font-extrabold text-slate-900">{t(uiLanguage, 'selectLanguage')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t(uiLanguage, 'flow')}</p>
          </div>
          <div className="flex gap-2" role="group" aria-label={t(uiLanguage, 'selectLanguage')}>
            <button type="button" onClick={() => changeLanguage('English')} className={`px-5 py-3 rounded-xl text-sm font-bold border transition ${uiLanguage === 'English' ? 'bg-ayur-600 text-white border-ayur-600' : 'bg-white text-slate-700 border-slate-200 hover:border-ayur-300'}`}>English</button>
            <button type="button" onClick={() => changeLanguage('Hindi')} className={`px-5 py-3 rounded-xl text-sm font-bold border transition ${uiLanguage === 'Hindi' ? 'bg-ayur-600 text-white border-ayur-600' : 'bg-white text-slate-700 border-slate-200 hover:border-ayur-300'}`}>हिंदी</button>
          </div>
        </div>
      </div>

          {/* Section 3: Visible Patient Consent */}
          <div className={`rounded-2xl border-2 p-5 sm:p-6 shadow-sm ${consentGiven ? 'bg-emerald-50/60 border-emerald-300' : 'bg-amber-50/70 border-amber-300'}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t(uiLanguage, 'consentTitle')}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">{t(uiLanguage, 'required')}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t(uiLanguage, 'consentText')}
                </p>
                <label className="mt-4 flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600" />
                  <span className="text-xs font-semibold text-slate-800">{t(uiLanguage, 'consentCheck')}</span>
                </label>
                <div className={`mt-3 flex items-center gap-2 text-[10px] font-semibold ${consentGiven ? 'text-emerald-700' : 'text-amber-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${consentGiven ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {consentGiven ? t(uiLanguage, 'consentReady') : t(uiLanguage, 'consentRequired')}
                </div>
              </div>
            </div>
          </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
          <ClipboardList className="w-4 h-4" /> {uiLanguage === 'Hindi' ? 'चरण 2 / 12' : 'Screen 2 of 12'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t(uiLanguage, 'patientIntake')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t(uiLanguage, 'intakeDescription')}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successResult ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {t(uiLanguage, 'registered')}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {t(uiLanguage, 'registeredDesc')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{t(uiLanguage, 'patientId')}</span>
              <p className="font-mono text-sm font-bold text-slate-800">{successResult.patient.patientId}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{t(uiLanguage, 'caseId')}</span>
              <p className="font-mono text-sm font-bold text-ayur-700">{successResult.consultation.consultationId}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{t(uiLanguage, 'patientName')}</span>
              <p className="text-sm font-bold text-slate-800">{successResult.patient.name}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{t(uiLanguage, 'abha')}</span>
              <p className="font-mono text-xs font-semibold text-slate-600 truncate">{successResult.patient.abhaId}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/interview')}
            className="px-6 py-3 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white font-bold text-sm shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
          >
            <span>{t(uiLanguage, 'proceedInterview')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Demographics */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-ayur-600" /> {t(uiLanguage, 'patientDemographics')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'fullName')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={uiLanguage === 'Hindi' ? 'जैसे: आरव शर्मा' : 'e.g. Aarav Sharma'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'age')} *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder={uiLanguage === 'Hindi' ? 'जैसे: 45' : 'e.g. 45'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'gender')} *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                >
                  <option value="Male">{t(uiLanguage, 'genderMale')}</option>
                  <option value="Female">{t(uiLanguage, 'genderFemale')}</option>
                  <option value="Other">{t(uiLanguage, 'genderOther')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'phone')} *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'language')}</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'bloodGroup')}</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Chief Complaint & {t(uiLanguage, 'consultationType')} */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-ayur-600" /> {t(uiLanguage, 'chiefComplaint')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t(uiLanguage, 'primaryComplaint')} *
                </label>
                <textarea
                  name="chiefComplaint"
                  rows={2}
                  value={formData.chiefComplaint}
                  onChange={handleChange}
                  placeholder={t(uiLanguage, 'complaintPlaceholder')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'duration')}</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder={uiLanguage === 'Hindi' ? 'जैसे: 4 दिन' : 'e.g. 4 days'}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'consultationType')}</label>
                  <select
                    name="consultationType"
                    value={formData.consultationType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  >
                    <option value="In-Person Outpatient">{t(uiLanguage, 'inPerson')}</option>
                    <option value="Teleconsultation">{t(uiLanguage, 'tele')}</option>
                    <option value="Emergency Triage">{t(uiLanguage, 'emergency')}</option>
                    <option value="AYUSH Wellness Clinic">{t(uiLanguage, 'ayush')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'priority')}</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  >
                    <option value="Routine">{t(uiLanguage, 'routine')}</option>
                    <option value="Urgent">{t(uiLanguage, 'urgent')}</option>
                    <option value="High Risk">{t(uiLanguage, 'highRisk')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Kiosk Vitals */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" /> {t(uiLanguage, 'vitals')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'bp')}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.vitals.bpSystolic}
                    onChange={(e) => handleVitalChange('bpSystolic', e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-center"
                    placeholder="120"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    value={formData.vitals.bpDiastolic}
                    onChange={(e) => handleVitalChange('bpDiastolic', e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-center"
                    placeholder="80"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'pulse')} (bpm)</label>
                <input
                  type="number"
                  value={formData.vitals.pulse}
                  onChange={(e) => handleVitalChange('pulse', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                  placeholder="72"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'spO2')} (%)</label>
                <input
                  type="number"
                  value={formData.vitals.spO2}
                  onChange={(e) => handleVitalChange('spO2', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                  placeholder="98"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t(uiLanguage, 'temperature')} (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vitals.temperature}
                  onChange={(e) => handleVitalChange('temperature', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                  placeholder="98.6"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !consentGiven}
              className="px-6 py-3 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white font-bold text-sm shadow-md shadow-ayur-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <span>{loading ? t(uiLanguage, 'submitting') : t(uiLanguage, 'submitStart')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PatientIntakePage;
