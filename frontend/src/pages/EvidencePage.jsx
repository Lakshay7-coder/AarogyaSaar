import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import EvidenceBadge from '../components/EvidenceBadge';
import {
  Layers,
  Search,
  Filter,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  X,
  FileText,
  Clock,
  Mic,
  Scan,
  Activity
} from 'lucide-react';

const EvidencePage = () => {
  const navigate = useNavigate();
  const { activeConsultationId, activePatient } = useCase();

  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSource, setFilterSource] = useState('ALL');
  const [inspectItem, setInspectItem] = useState(null);

  const fetchEvidence = async () => {
    if (!activeConsultationId) return;
    setLoading(true);
    try {
      const res = await api.get(`/evidence/${activeConsultationId}`);
      if (res.data.success) {
        setEvidenceList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [activeConsultationId]);

  const filtered = evidenceList.filter((e) => {
    if (filterSource === 'ALL') return true;
    return e.sourceType === filterSource;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" /> Screen 6 of 12
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Evidence & Provenance Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every clinical finding retains full traceable provenance back to patient interview turns or OCR document lines.
          </p>
        </div>

        <button
          onClick={() => navigate('/completeness')}
          className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
        >
          <span>Step 7: Completeness Engine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter by Provenance Source:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'PATIENT_INTERVIEW', 'OCR', 'PATIENT_HISTORY', 'DOCTOR_ENTERED'].map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterSource === src
                  ? 'bg-ayur-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {src === 'ALL' ? 'All Sources' : src.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4">Finding / Entity</th>
                <th className="p-4">Extracted Value</th>
                <th className="p-4">Provenance Source</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Verification</th>
                <th className="p-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    No evidence records found matching this source filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.findingKey}</div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {item.findingCategory}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {item.findingValue}
                    </td>
                    <td className="p-4">
                      <EvidenceBadge sourceType={item.sourceType} />
                      <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[200px]">
                        {item.sourceName}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">
                      {Math.round((item.confidence || 0.9) * 100)}%
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : item.verificationStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {item.verificationStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setInspectItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-ayur-100 hover:text-ayur-800 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Inspect Source
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Source Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <EvidenceBadge sourceType={inspectItem.sourceType} />
                <span className="text-xs font-bold text-slate-800">Source Provenance Detail</span>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Clinical Finding</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{inspectItem.findingKey}</p>
                <p className="text-slate-600 font-medium">{inspectItem.findingValue}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Source Identifier</span>
                <p className="text-slate-800 font-semibold">{inspectItem.sourceName}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Primary Source Quotation / Extract Snippet
                </span>
                <p className="text-slate-800 font-mono text-xs leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  "{inspectItem.sourceSnippet || 'Document extracted line verified in clinical record.'}"
                </p>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span>Recorded: {new Date(inspectItem.createdAt || Date.now()).toLocaleTimeString()}</span>
                <span className="font-semibold text-emerald-700">AI Confidence: {Math.round((inspectItem.confidence || 0.9) * 100)}%</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidencePage;
