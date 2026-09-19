import React from 'react';
import { CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const CompletenessGauge = ({ percentage = 0, isReadyForReview = false, size = 'md' }) => {
  const getColor = (pct) => {
    if (pct >= 80) return 'text-emerald-600 stroke-emerald-500';
    if (pct >= 50) return 'text-amber-600 stroke-amber-500';
    return 'text-rose-600 stroke-rose-500';
  };

  const getBgColor = (pct) => {
    if (pct >= 80) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (pct >= 50) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-rose-50 text-rose-800 border-rose-200';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Circular Progress Indicator */}
      <div className="relative flex items-center justify-center">
        <svg className="w-14 h-14 transform -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="22"
            className="stroke-slate-100"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="28"
            cy="28"
            r="22"
            className={getColor(percentage)}
            strokeWidth="4"
            strokeDasharray={138.2}
            strokeDashoffset={138.2 - (138.2 * percentage) / 100}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <span className="absolute text-xs font-bold text-slate-800">{percentage}%</span>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800">Case Completeness</span>
          {isReadyForReview && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" /> Ready for Review
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          {percentage >= 80
            ? 'Optimal clinical data captured'
            : percentage >= 50
            ? 'Sufficient for triage review'
            : 'Intake and records needed'}
        </p>
      </div>
    </div>
  );
};

export default CompletenessGauge;
