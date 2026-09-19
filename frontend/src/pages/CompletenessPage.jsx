import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import CompletenessGauge from '../components/CompletenessGauge';
import {
  Gauge,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Sparkles
} from 'lucide-react';

const CompletenessPage = () => {
  const navigate = useNavigate();
  const { activeConsultationId, activePatient } = useCase();

  const [completenessData, setCompletenessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCompleteness = async () => {
    if (!activeConsultationId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/completeness/${activeConsultationId}`);
      if (res.data.success) {
        setCompletenessData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleteness();
  }, [activeConsultationId]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Gauge className="w-4 h-4" /> Screen 7 of 12
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Case Completeness Engine
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time multi-category scoring determining readiness for clinical triage and ABDM sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCompleteness}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Recalculate completeness score"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-ayur-600' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/timeline')}
            className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
          >
            <span>Step 8: Patient Timeline</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!completenessData ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Gauge className="w-12 h-12 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Calculating clinical completeness index...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <CompletenessGauge
              percentage={completenessData.overallPercentage}
              isReadyForReview={completenessData.isReadyForDoctorReview}
            />

            <div className="flex items-center gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Items</span>
                <span className="text-base font-bold text-emerald-700">
                  {completenessData.completedFields?.length || 0}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Missing Items</span>
                <span className="text-base font-bold text-amber-700">
                  {completenessData.missingFields?.length || 0}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Triage Status</span>
                <span className="text-xs font-bold text-slate-800">
                  {completenessData.isReadyForDoctorReview ? 'Physician Review Ready' : 'Incomplete Intake'}
                </span>
              </div>
            </div>
          </div>

          {/* Category Score Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Category Score Distribution
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(completenessData.scoreBreakdown || {}).map(([cat, score], idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">{cat}</span>
                    <span className="font-mono font-bold text-ayur-700">{score} pts</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-ayur-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min((score / 15) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed vs Missing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completed Fields */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Captured Clinical Data ({completenessData.completedFields?.length || 0})
              </h2>
              <div className="space-y-2">
                {completenessData.completedFields?.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 text-xs font-semibold text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Fields & Recommended Follow-ups */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Information Gaps ({completenessData.missingFields?.length || 0})
                </h2>
                {completenessData.missingFields?.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-semibold">No critical clinical gaps detected!</p>
                ) : (
                  <div className="space-y-2">
                    {completenessData.missingFields.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 text-xs font-semibold text-amber-900">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {completenessData.recommendedFollowUpQuestions?.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-ayur-600" /> AI-Recommended Follow-Up Inquiries
                  </span>
                  <div className="space-y-2">
                    {completenessData.recommendedFollowUpQuestions.map((q, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletenessPage;
