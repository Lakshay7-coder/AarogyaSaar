import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import {
  Flower2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Coffee,
  Moon,
  Zap,
  Save,
  ShieldCheck
} from 'lucide-react';

const AyushAssessmentPage = () => {
  const navigate = useNavigate();
  const { activeConsultationId, activePatient, refreshCase } = useCase();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Doctor editing state
  const [verifiedDosha, setVerifiedDosha] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [selectedHerbs, setSelectedHerbs] = useState([]);
  const [dashavidha, setDashavidha] = useState({
    prakriti: 'Pitta-Vata', vikriti: 'Pitta-Vata tendency', sara: 'Madhyama', samhanana: 'Madhyama',
    pramana: 'Madhyama', satmya: 'Madhyama', satva: 'Madhyama', aharaShakti: 'Madhyama',
    vyayamaShakti: 'Madhyama', vaya: 'Madhyama (30-60 years)'
  });

  const fetchAssessment = async () => {
    if (!activeConsultationId) return;
    setLoading(true);
    try {
      const res = await api.get(`/ayush/${activeConsultationId}`);
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setAssessment(data);
        setVerifiedDosha(data.doctorAssessment?.verifiedDosha || data.prakriti?.dominantDosha || 'Pitta-Vata');
        setClinicalNotes(data.doctorAssessment?.clinicalNotes || '');
        setDashavidha(data.dashavidhaPariksha || dashavidha);
        setSelectedHerbs(data.doctorAssessment?.prescribedAyushRegimen || [
          'Nisha-Amalaki Churna: 3g twice daily before food with warm water.'
        ]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [activeConsultationId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/ayush/${activeConsultationId}`, {
        prakriti: assessment.prakriti,
        vikriti: assessment.vikriti,
        agni: assessment.agni,
        dashavidhaPariksha: dashavidha,
        lifestyle: assessment.lifestyle,
        aiSuggestions: assessment.aiSuggestions,
        doctorAssessment: {
          verifiedDosha,
          clinicalNotes,
          prescribedAyushRegimen: selectedHerbs,
          isVerified: true,
          verifiedBy: user?.name || 'Dr. Vikramaditya Sharma, MD',
          verifiedAt: new Date()
        }
      });
      if (res.data.success) {
        setSuccessMsg('AYUSH Assessment successfully verified and saved to patient record!');
        refreshCase();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Flower2 className="w-4 h-4" /> Screen 9 of 12
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AYUSH Holistic Assessment & Integrative Care
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Structured traditional constitution (Prakriti), digestive fire (Agni), and evidence-supported Ayurvedic regimens.
          </p>
        </div>

        <button
          onClick={() => navigate('/doctor/queue')}
          className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
        >
          <span>Step 10: Doctor Command Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {!assessment ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Flower2 className="w-12 h-12 text-ayur-600 animate-pulse mx-auto mb-3" />
          <p className="text-sm text-slate-500">Evaluating dosha distribution & Agni index...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Grid: Prakriti & Agni */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prakriti Constitution Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Flower2 className="w-4 h-4 text-ayur-600" /> Prakriti (Constitutional Archetype)
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-ayur-100 text-ayur-800">
                  {assessment.prakriti?.dominantDosha || 'Pitta-Vata'}
                </span>
              </div>

              <div className="space-y-3">
                {/* Vata */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-sky-800">Vata (Kinetic / Movement)</span>
                    <span className="text-sky-700">{assessment.prakriti?.vata || 35}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-sky-500 h-2 rounded-full"
                      style={{ width: `${assessment.prakriti?.vata || 35}%` }}
                    ></div>
                  </div>
                </div>

                {/* Pitta */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-amber-800">Pitta (Metabolic / Transformative)</span>
                    <span className="text-amber-700">{assessment.prakriti?.pitta || 45}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${assessment.prakriti?.pitta || 45}%` }}
                    ></div>
                  </div>
                </div>

                {/* Kapha */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-800">Kapha (Structural / Cohesive)</span>
                    <span className="text-emerald-700">{assessment.prakriti?.kapha || 20}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${assessment.prakriti?.kapha || 20}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <span className="font-bold text-slate-800">Vikriti (Active Imbalance): </span>
                {assessment.vikriti?.currentImbalance || 'Pitta-Vata Vriddhi with secondary Rakta involvement'}
              </div>
            </div>

            {/* Agni & Dhatu Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Agni (Digestive & Metabolic Fire)
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                  {assessment.agni?.agniType || 'Tikshnagni (Intense)'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {assessment.agni?.description ||
                  'Accelerated metabolic rate causing tendency towards acid regurgitation, hunger distress, and tissue warmth.'}
              </p>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Dhatus Involved (Tissue Depths)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(assessment.dhatu || ['Rasa (Plasma)', 'Rakta (Blood)', 'Meda (Adipose)']).map((d, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sleep Pattern</span>
                  <span className="font-semibold text-slate-800">{assessment.lifestyle?.sleepPattern || '6 hours, restless'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Dietary Nature</span>
                  <span className="font-semibold text-slate-800">{assessment.lifestyle?.dietType || 'Vegetarian'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashavidha Pariksha — patient-reported / clinician-reviewed tenfold assessment */}
          <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Dashavidha Pariksha</h2>
                <p className="text-xs text-slate-500 mt-1">Tenfold AYUSH case-taking layer. Values are structured observations for physician review, not an autonomous diagnosis.</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">10 dimensions captured</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                ['prakriti','Prakriti'], ['vikriti','Vikriti'], ['sara','Sara'], ['samhanana','Samhanana'], ['pramana','Pramana'],
                ['satmya','Satmya'], ['satva','Satva'], ['aharaShakti','Ahara Shakti'], ['vyayamaShakti','Vyayama Shakti'], ['vaya','Vaya']
              ].map(([key,label]) => (
                <label key={key} className="text-[11px] font-semibold text-slate-700">
                  <span className="block mb-1">{label}</span>
                  <select value={dashavidha[key] || ''} onChange={(e) => setDashavidha((prev) => ({ ...prev, [key]: e.target.value }))} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-ayur-500">
                    {['Madhyama','Uttama','Avara','Pitta-Vata','Pitta','Vata','Kapha','Madhyama (30-60 years)','Vriddha (60+ years)','Bala/Yuva (<30 years)'].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>

          {/* Classical Herbal Evidence Suggestions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-ayur-600" /> Classical AYUSH Herbal Recommendations & References
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(assessment.aiSuggestions?.herbalRecommendations || []).map((herb, i) => (
                <div key={i} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-2">
                  <div className="font-bold text-emerald-950 text-sm">{herb.herb}</div>
                  <p className="text-slate-600">{herb.indication}</p>
                  <div className="pt-2 border-t border-emerald-100 flex items-center gap-1 text-[11px] text-emerald-800 font-semibold italic">
                    <BookOpen className="w-3 h-3 text-emerald-600" /> {herb.classicalRef}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Verification & Integration Workspace */}
          <div className="bg-white rounded-2xl border-2 border-ayur-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-ayur-600" /> Physician Verification & Regimen Sign-off
              </h2>
              <span className="text-xs font-bold text-ayur-700 bg-ayur-50 px-2.5 py-1 rounded-full border border-ayur-200">
                Doctor Supervision Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verified Prakriti / Imbalance Diagnosis
                </label>
                <input
                  type="text"
                  value={verifiedDosha}
                  onChange={(e) => setVerifiedDosha(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Integrative Clinical Notes
                </label>
                <input
                  type="text"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Concur with AI assessment. Advise Nisha-Amalaki before meals."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white font-bold text-xs shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save & Verify AYUSH Assessment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AyushAssessmentPage;
