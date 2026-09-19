import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Pill,
  FlaskConical,
  ClipboardCheck,
  Stethoscope,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock3
} from 'lucide-react';

const riskWords = [
  'breathing difficulty', 'shortness of breath', 'chest pain', 'fainting',
  'unconscious', 'severe bleeding', 'confusion', 'seizure', 'very high fever'
];

const normalise = (value) => String(value || '').toLowerCase();

const ClinicalIntelligencePage = () => {
  const navigate = useNavigate();
  const { activeConsultationId, activeConsultation, activePatient, refreshCase } = useCase();
  const [evidence, setEvidence] = useState([]);
  const [clinicalCase, setClinicalCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!activeConsultationId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/evidence/${activeConsultationId}`);
      if (res.data.success) setEvidence(res.data.data || []);
      try {
        const caseRes = await api.get(`/cases/${activeConsultationId}`);
        if (caseRes.data.success) setClinicalCase(caseRes.data.data);
      } catch (caseErr) {
        console.warn('Clinical case not reconstructed yet:', caseErr.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load clinical intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeConsultationId]);

  const intelligence = useMemo(() => {
    const complaint = normalise(activeConsultation?.chiefComplaint);
    const evidenceText = evidence.map((e) => `${e.findingKey} ${e.findingValue}`).join(' ');
    const allText = `${complaint} ${normalise(activeConsultation?.notes)} ${normalise(evidenceText)}`;
    const keywordFlags = riskWords.filter((word) => allText.includes(word));
    const priority = activeConsultation?.priority || 'Routine';
    const caseText = normalise(clinicalCase?.clinicalSummary);
    const caseSymptoms = (clinicalCase?.symptoms || []).map((s) => normalise(s.name)).join(' ');
    const riskTerms = [...riskWords, 'paresthesia', 'neuropathic burning', 'very high blood glucose', 'persistent vomiting'];
    const detectedRiskSignals = riskTerms.filter((word) => `${allText} ${caseText} ${caseSymptoms}`.includes(word));
    const highRisk = priority === 'High Risk' || priority === 'Emergency' || priority === 'Urgent' || detectedRiskSignals.length > 0;

    const medications = evidence.filter((e) =>
      e.findingCategory === 'medication' || /medicine|medication|drug|tablet|capsule|syrup/i.test(`${e.findingKey} ${e.findingValue}`)
    );
    const investigations = evidence.filter((e) =>
      ['lab', 'vital'].includes(e.findingCategory) || /cbc|blood|lab|test|x-ray|xray|scan|imaging|mri|ultrasound|investigation/i.test(`${e.findingKey} ${e.findingValue}`)
    );
    const pending = evidence.filter((e) => e.verificationStatus === 'PENDING');
    const verified = evidence.filter((e) => ['VERIFIED', 'EDITED'].includes(e.verificationStatus));
    const readiness = evidence.length === 0 ? 0 : Math.round((verified.length / evidence.length) * 100);

    return { priority, highRisk, keywordFlags, detectedRiskSignals, medications, investigations, pending, readiness };
  }, [activeConsultation, evidence, clinicalCase]);

  if (!activeConsultationId) {
    return <div className="max-w-5xl mx-auto p-8 text-center text-slate-500">Select a consultation first.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" /> Clinical Intelligence • ZIP2 Enhancement
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Doctor 30-Second Clinical Brief</h1>
          <p className="text-sm text-slate-500 mt-1">A compact safety, medication, investigation and handoff view built on the existing verified case data.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { refreshCase(); load(); }} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 inline-flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => navigate('/doctor/verify')} className="px-4 py-2 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold inline-flex items-center gap-2">
            Verification <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`rounded-2xl border p-5 shadow-sm ${intelligence.highRisk ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Safety Gate</span>
            {intelligence.highRisk ? <ShieldAlert className="w-5 h-5 text-rose-600" /> : <ShieldCheck className="w-5 h-5 text-emerald-600" />}
          </div>
          <div className={`text-2xl font-extrabold mt-3 ${intelligence.highRisk ? 'text-rose-700' : 'text-emerald-700'}`}>
            {intelligence.highRisk ? 'REVIEW REQUIRED' : 'NO HIGH-RISK SIGNAL'}
          </div>
          <p className="text-xs text-slate-600 mt-2">Priority: <b>{intelligence.priority}</b>. This is a safety-support signal, not a diagnosis.</p>
          {intelligence.detectedRiskSignals.length > 0 && <div className="mt-3 space-y-1">{intelligence.detectedRiskSignals.slice(0, 4).map((flag) => <div key={flag} className="text-xs font-semibold text-rose-800 flex gap-2"><AlertTriangle className="w-3.5 h-3.5" /> {flag}</div>)}</div>}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold"><ClipboardCheck className="w-5 h-5 text-ayur-600" /> 30-Second Brief</div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-xs uppercase font-bold text-slate-400">Patient</span><p className="font-bold mt-1">{activePatient?.name || 'Patient'} • {activePatient?.age || '—'} years • {activePatient?.gender || '—'}</p></div>
            <div><span className="text-xs uppercase font-bold text-slate-400">Chief Complaint</span><p className="font-bold mt-1">{activeConsultation?.chiefComplaint || 'Not recorded'}</p></div>
            <div><span className="text-xs uppercase font-bold text-slate-400">Duration</span><p className="font-medium mt-1">{activeConsultation?.duration || 'Not recorded'}</p></div>
            <div><span className="text-xs uppercase font-bold text-slate-400">Vitals</span><p className="font-medium mt-1">BP {activeConsultation?.vitals?.bpSystolic}/{activeConsultation?.vitals?.bpDiastolic} • Pulse {activeConsultation?.vitals?.pulse} • SpO₂ {activeConsultation?.vitals?.spO2}%</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><h2 className="font-bold text-slate-900">AI Clinical Synthesis</h2><p className="text-xs text-slate-500 mt-1">The 30-second view is assembled from recorded patient history and uploaded evidence.</p></div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">AI draft • physician decides</span>
        </div>
        <p className="text-sm leading-6 text-slate-700">{clinicalCase?.clinicalSummary || 'Complete the interview and document processing to generate the unified doctor-ready clinical summary.'}</p>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(clinicalCase?.symptoms || []).slice(0, 4).map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-800">{item.name}</div>
              <div className="text-[10px] text-slate-500 mt-1">Source: {item.source || 'Patient record'}</div>
              {item.sourceRef && <div className="text-[10px] text-ayur-700 mt-1 truncate">{item.sourceRef}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <IntelCard icon={<Pill className="w-5 h-5 text-violet-600" />} title="Medication Reconciliation" count={intelligence.medications.length} items={intelligence.medications} empty="No medication evidence recorded." />
        <IntelCard icon={<FlaskConical className="w-5 h-5 text-sky-600" />} title="Investigation Intelligence" count={intelligence.investigations.length} items={intelligence.investigations} empty="No investigation/lab evidence recorded." />
        <IntelCard icon={<Activity className="w-5 h-5 text-emerald-600" />} title="Handoff Readiness" count={intelligence.readiness} percent items={[]} empty="" readiness={intelligence.readiness} pending={intelligence.pending.length} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div><h2 className="font-bold text-slate-900">Verification Gate</h2><p className="text-xs text-slate-500 mt-1">Only verified/edited evidence should be treated as confirmed clinical information.</p></div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${intelligence.pending.length ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {intelligence.pending.length ? `${intelligence.pending.length} pending` : 'All reviewed'}
          </span>
        </div>
        {intelligence.pending.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {intelligence.pending.slice(0, 6).map((item) => <div key={item._id} className="p-3 rounded-xl bg-amber-50 border border-amber-100"><div className="text-xs font-bold text-slate-800">{item.findingKey}</div><div className="text-xs text-slate-600 mt-1">{item.findingValue}</div><div className="text-[10px] text-amber-700 mt-2 flex items-center gap-1"><Clock3 className="w-3 h-3" /> Physician review required</div></div>)}
          </div>
        ) : <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold"><CheckCircle2 className="w-5 h-5" /> Evidence is ready for physician sign-off.</div>}
      </div>

      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <b>Clinical safety:</b> This enhancement summarizes existing case evidence and flags review signals. It does not diagnose, prescribe, or replace physician judgment.
      </div>
    </div>
  );
};

function IntelCard({ icon, title, count, items, empty, percent, readiness, pending }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm min-h-52">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-bold text-slate-900">{icon}{title}</div><span className="text-lg font-extrabold text-slate-900">{percent ? `${count}%` : count}</span></div>
      {percent ? <>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-5"><div className="h-full bg-ayur-600 rounded-full" style={{ width: `${Math.max(0, Math.min(100, readiness))}%` }} /></div>
        <p className="text-xs text-slate-500 mt-3">{pending ? `${pending} evidence item(s) still need review.` : 'All available evidence has been reviewed.'}</p>
      </> : items.length ? <div className="mt-4 space-y-2">{items.slice(0, 5).map((item) => <div key={item._id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100"><div className="text-xs font-bold text-slate-800">{item.findingKey}</div><div className="text-xs text-slate-600 mt-0.5">{item.findingValue}</div></div>)}</div> : <p className="text-xs text-slate-500 mt-5">{empty}</p>}
    </div>
  );
}

export default ClinicalIntelligencePage;
