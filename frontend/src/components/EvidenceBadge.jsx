import React from 'react';
import { Mic, FileText, Scan, History, Stethoscope, Check, X, AlertTriangle } from 'lucide-react';

const EvidenceBadge = ({ sourceType, confidence, verificationStatus }) => {
  const getSourceConfig = (type) => {
    switch (type) {
      case 'PATIENT_INTERVIEW':
        return { label: 'Patient Voice/Chat', bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: Mic };
      case 'OCR':
        return { label: 'OCR Extracted', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Scan };
      case 'MEDICAL_DOCUMENT':
        return { label: 'Medical Document', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText };
      case 'PATIENT_HISTORY':
        return { label: 'Intake / History', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: History };
      case 'DOCTOR_ENTERED':
        return { label: 'Doctor Entered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Stethoscope };
      default:
        return { label: type || 'Evidence', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileText };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return { label: 'Doctor Verified', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Check };
      case 'EDITED':
        return { label: 'Doctor Edited', bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: Check };
      case 'REJECTED':
        return { label: 'Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: X };
      default:
        return { label: 'Pending Verification', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle };
    }
  };

  const sourceConfig = getSourceConfig(sourceType);
  const statusConfig = verificationStatus ? getStatusBadge(verificationStatus) : null;
  const SourceIcon = sourceConfig.icon;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {/* Source pill */}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${sourceConfig.bg}`}>
        <SourceIcon className="w-3 h-3" />
        {sourceConfig.label}
      </span>

      {/* Confidence pill */}
      {confidence !== undefined && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
          {Math.round(confidence * 100)}% Conf
        </span>
      )}

      {/* Verification status pill */}
      {statusConfig && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusConfig.bg}`}>
          <StatusIcon className="w-2.5 h-2.5" />
          {statusConfig.label}
        </span>
      )}
    </div>
  );
};

export default EvidenceBadge;
