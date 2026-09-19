import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import EvidenceBadge from '../components/EvidenceBadge';
import confetti from 'canvas-confetti';
import {
  CheckCheck,
  Check,
  Edit3,
  X,
  MessageSquare,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  FileCheck,
  History,
  RotateCw
} from 'lucide-react';

const DoctorVerificationPage = () => {
  const navigate = useNavigate();
  const { activeConsultationId, activePatient, activeConsultation, refreshCase } = useCase();
  const { user } = useAuth();

  const [evidenceList, setEvidenceList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchEvidenceAndAudits = async () => {
    if (!activeConsultationId) return;
    setLoading(true);
    try {
      const [evRes, auditRes] = await Promise.all([
        api.get(`/evidence/${activeConsultationId}`),
        api.get(`/doctor/audit-trail/${activeConsultationId}`)
      ]);

      if (evRes.data.success) {
        setEvidenceList(evRes.data.data);
      }
      if (auditRes.data.success) {
        setAuditLogs(auditRes.data.verifications || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceAndAudits();
  }, [activeConsultationId]);

  const handleAction = async (item, action, customVal, notes) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/doctor/verify', {
        consultationId: activeConsultationId,
        findingId: item._id,
        findingCategory: item.findingCategory,
        findingKey: item.findingKey,
        previousValue: item.findingValue,
        verifiedValue: customVal !== undefined ? customVal : item.findingValue,
        action,
        clinicalNotes: notes || ''
      });

      if (res.data.success) {
        setSuccessMsg(`Finding "${item.findingKey}" marked as ${action}`);
        setEditingItem(null);
        await fetchEvidenceAndAudits();
        refreshCase();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setError('');
    try {
      const res = await api.post(`/doctor/finalize/${activeConsultationId}`, {
        clinicalNotes: 'Case verified by physician. Unlocked for ABDM health information exchange.'
      });

      if (res.data.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setSuccessMsg('Case successfully finalized & verified! Proceeding to FHIR / ABDM output.');
        refreshCase();
        setTimeout(() => navigate('/fhir'), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setFinalizing(false);
    }
  };

  const isFinalized = activeConsultation?.status === 'finalized';
  const pendingCount = evidenceList.filter((e) => e.verificationStatus === 'PENDING').length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckCheck className="w-4 h-4" /> Screen 11 of 12
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Doctor Verification & Clinical Sign-Off Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Supervise AI and OCR extracted entities. Verify, edit, or reject findings with a permanent audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvidenceAndAudits}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Refresh verification workspace"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-ayur-600' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/fhir')}
            className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
          >
            <span>Step 12: FHIR / ABDM Export</span>
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

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Verification Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Encounter Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                isFinalized ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeConsultation?.status || 'under_review'}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {pendingCount === 0
              ? 'All clinical findings have been reviewed and verified. Case is ready for final lockdown.'
              : `${pendingCount} findings currently pending physician sign-off.`}
          </p>
        </div>

        <button
          onClick={handleFinalize}
          disabled={finalizing || isFinalized}
          className={`px-6 py-3 rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-2 transition ${
            isFinalized
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.98]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{isFinalized ? 'Case Finalized & Locked' : finalizing ? 'Finalizing...' : 'Finalize & Lock Case'}</span>
        </button>
      </div>

      {/* Findings Verification List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-ayur-600" /> Clinical Findings for Verification ({evidenceList.length})
        </h2>

        <div className="divide-y divide-slate-100">
          {evidenceList.map((item) => (
            <div key={item._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{item.findingKey}</span>
                  <EvidenceBadge
                    sourceType={item.sourceType}
                    confidence={item.confidence}
                    verificationStatus={item.verificationStatus}
                  />
                </div>
                <p className="text-xs text-slate-600 font-medium">Value: {item.findingValue}</p>
                <p className="text-[11px] text-slate-400 font-mono italic">Source: {item.sourceName}</p>
                {item.doctorNotes && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
                    Dr. Note: {item.doctorNotes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAction(item, 'VERIFY')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1 transition"
                  title="Mark as Verified"
                >
                  <Check className="w-3.5 h-3.5" />
                  Verify
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(item);
                    setEditValue(item.findingValue);
                    setEditNotes(item.doctorNotes || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold inline-flex items-center gap-1 transition"
                  title="Edit finding value"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(item, 'REJECT')}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 transition"
                  title="Reject finding"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Finding Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Edit Clinical Finding Value</h2>
            <p className="text-xs text-slate-500">
              Editing <span className="font-bold text-slate-800">{editingItem.findingKey}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Previous AI/OCR Value</label>
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600 font-mono">{editingItem.findingValue}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physician Verified Value *</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor Clinical Rationale / Note</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Reason for adjustment..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-ayur-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(editingItem, 'EDIT', editValue, editNotes)}
                className="px-4 py-2 text-xs font-bold bg-ayur-600 text-white rounded-lg hover:bg-ayur-700 shadow-sm"
              >
                Save Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" /> Physician Verification Audit Trail ({auditLogs.length})
        </h2>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No physician audit actions logged yet for this case.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <th className="py-2">Time</th>
                  <th className="py-2">Physician</th>
                  <th className="py-2">Finding</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Previous Value</th>
                  <th className="py-2">Verified Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="py-2 font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2 font-semibold text-slate-800">{log.doctorName}</td>
                    <td className="py-2 font-medium">{log.findingKey}</td>
                    <td className="py-2">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {log.previousValue}
                    </td>
                    <td className="py-2 font-semibold text-emerald-800 font-mono text-[11px] max-w-xs truncate">
                      {log.verifiedValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorVerificationPage;
