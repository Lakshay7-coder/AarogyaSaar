import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import EvidenceBadge from '../components/EvidenceBadge';
import {
  Brain,
  Sparkles,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Activity,
  Pill,
  Heart,
  Layers
} from 'lucide-react';

const CaseReconstructionPage = () => {
  const navigate = useNavigate();
  const { activeConsultationId, activePatient, refreshCase } = useCase();

  const [clinicalCase, setClinicalCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCase = async () => {
    if (!activeConsultationId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/cases/${activeConsultationId}`);
      if (res.data.success) {
        setClinicalCase(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // Not reconstructed yet, trigger reconstruction
        triggerReconstruction();
      } else {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerReconstruction = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/cases/reconstruct/${activeConsultationId}`);
      if (res.data.success) {
        setClinicalCase(res.data.data);
        refreshCase();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Reconstruction failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [activeConsultationId]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" /> Screen 5 of 12
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Multimodal Clinical Case Reconstruction
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Synthesized dossier combining Kiosk Intake, AI Voice Interview, and OCR Medical Records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerReconstruction}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ayur-600' : ''}`} />
            <span>{loading ? 'Reconstructing...' : 'Re-synthesize Case'}</span>
          </button>

          <button
            onClick={() => navigate('/evidence')}
            className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
          >
            <span>Step 6: Inspect Evidence</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && !clinicalCase ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Brain className="w-12 h-12 text-ayur-600 animate-pulse mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Synthesizing Multimodal Evidence...</h2>
          <p className="text-xs text-slate-400 mt-1">
            Reconstructing clinical case from intake vitals, dialogue turns, and OCR extractions.
          </p>
        </div>
      ) : !clinicalCase ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-600">No reconstructed case dossier available yet.</p>
          <button
            onClick={triggerReconstruction}
            className="mt-4 px-5 py-2.5 rounded-xl bg-ayur-600 text-white text-xs font-bold inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Trigger Initial Reconstruction
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Clinical Narrative Summary Banner */}
          <div className="bg-gradient-to-br from-white to-ayur-50/40 rounded-2xl border border-ayur-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ayur-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-ayur-600" /> AI Synthesized Clinical Summary
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Confidence: {Math.round((clinicalCase.confidenceScore || 0.92) * 100)}%
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
                  {clinicalCase.status}
                </span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
              {clinicalCase.clinicalSummary}
            </p>
          </div>

          {/* Physician safety screen: never a diagnosis, only a patient-reported
              warning signal that should be reviewed by the clinician. */}
          {clinicalCase.redFlags?.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Potential Safety Flags — Physician Attention
              </h3>
              <div className="space-y-2">
                {clinicalCase.redFlags.map((flag, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-white/80 p-3 rounded-xl border border-rose-200">
                    <div>
                      <p className="text-sm font-bold text-rose-900">{flag.label}</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">Source: {flag.source || 'Patient interview'} • This is a safety alert, not a diagnosis.</p>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">{flag.priority || 'REVIEW'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflict / Contradiction Warnings if any */}
          {clinicalCase.contradictions?.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Conflict & Contradiction Alert
              </h3>
              <div className="space-y-2">
                {clinicalCase.contradictions.map((c, i) => (
                  <div key={i} className="text-xs text-amber-900 bg-white/70 p-3 rounded-xl border border-amber-200">
                    <p className="font-bold">{c.conflictType}</p>
                    <p className="mt-0.5">{c.description}</p>
                    <div className="mt-2 flex gap-4 text-[11px] text-slate-600 font-mono">
                      <span>Source A: {c.itemA}</span>
                      <span>Source B: {c.itemB}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-Column Structured Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Symptoms & Characteristics */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Activity className="w-4 h-4 text-emerald-600" /> Active Symptoms ({clinicalCase.symptoms?.length || 0})
              </h3>
              <div className="space-y-2.5">
                {clinicalCase.symptoms?.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                    <div className="text-slate-500 mt-1">
                      Duration: <span className="font-semibold text-slate-700">{s.duration || 'N/A'}</span> • Severity:{' '}
                      <span className="font-semibold text-slate-700">{s.severity || 'Moderate'}</span>
                    </div>
                    <div className="mt-2">
                      <EvidenceBadge sourceType={s.source} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Medications & Allergies */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Pill className="w-4 h-4 text-blue-600" /> Medications & Allergies
              </h3>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">Active Pharmacotherapy</span>
                <div className="space-y-2">
                  {clinicalCase.medications?.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{m.name} {m.dosage}</div>
                      <div className="text-[11px] text-slate-500">{m.frequency}</div>
                      <div className="mt-1.5">
                        <EvidenceBadge sourceType={m.source?.includes('OCR') ? 'OCR' : 'PATIENT_INTERVIEW'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">Allergies Profile</span>
                {clinicalCase.allergies?.map((a, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                    <span className="font-bold">{a.substance}</span>
                    <span className="text-[11px] block opacity-80">{a.reaction || 'No adverse reactions noted'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Investigations & Follow-Up Questions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-purple-600" /> Lab Findings & Unresolved Questions
              </h3>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">Laboratory Values</span>
                <div className="space-y-1.5">
                  {clinicalCase.labFindings?.map((lab, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                        lab.isAbnormal ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="font-semibold truncate mr-2">{lab.testName}</span>
                      <span className="font-mono font-bold shrink-0">
                        {lab.value} {lab.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">Unresolved Clinical Questions</span>
                <div className="space-y-2">
                  {clinicalCase.unresolvedQuestions?.map((q, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseReconstructionPage;
