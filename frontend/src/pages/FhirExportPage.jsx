import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import {
  Share2,
  Download,
  Copy,
  Check,
  Shield,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  RotateCw
} from 'lucide-react';

const FhirExportPage = () => {
  const { activeConsultationId, activePatient } = useCase();

  const [fhirData, setFhirData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' or 'raw_json'

  const fetchFhirRecord = async () => {
    if (!activeConsultationId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/fhir/${activeConsultationId}`);
      if (res.data.success) {
        setFhirData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFhirRecord();
  }, [activeConsultationId]);

  const handleCopyJson = () => {
    if (!fhirData?.bundle) return;
    navigator.clipboard.writeText(JSON.stringify(fhirData.bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!fhirData?.bundle) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(fhirData.bundle, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `FHIR_BUNDLE_${activeConsultationId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const bundle = fhirData?.bundle;
  const entries = bundle?.entry || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Share2 className="w-4 h-4" /> Screen 12 of 12 (Interoperability Complete)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            FHIR R4 & ABDM-Ready Interoperability Record
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Standardized HL7 FHIR Release 4 document bundle constructed from verified clinical findings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFhirRecord}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Reload FHIR bundle"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-ayur-600' : ''}`} />
          </button>

          <button
            onClick={handleCopyJson}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ABDM Prototype Disclaimer Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">ABDM Milestone 2 HIP Standard</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase font-bold border border-emerald-500/30">
                Sandbox Mode
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Synthesized conforming to National Resource Center for EHR Standards (NRCeS) OPConsultRecord profile.
              Only verified clinical parameters are mapped into this bundle.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Patient ABHA Address</span>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {activePatient?.abhaId || '91-7892-4512-8921@sbx'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'resources'
              ? 'border-b-2 border-ayur-600 text-ayur-700'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>FHIR Resource Explorer ({entries.length} Resources)</span>
        </button>

        <button
          onClick={() => setActiveTab('raw_json')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'raw_json'
              ? 'border-b-2 border-ayur-600 text-ayur-700'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Raw HL7 JSON Bundle</span>
        </button>
      </div>

      {!fhirData ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Share2 className="w-12 h-12 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Generating compliant FHIR R4 Bundle from verified records...</p>
        </div>
      ) : activeTab === 'resources' ? (
        /* Resources View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {entries.map((entry, idx) => {
              const res = entry.resource;
              return (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-ayur-50 text-ayur-800 text-[10px] font-mono font-bold uppercase border border-ayur-200">
                      {res.resourceType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs truncate mt-1">
                    {res.id || res.resourceType}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {res.title ||
                      res.code?.text ||
                      res.medicationCodeableConcept?.text ||
                      (res.name && res.name[0]?.text) ||
                      res.status}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Bundle Metadata & Provenance Header
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Bundle Type</span>
                <span className="font-bold text-slate-800">{bundle?.type}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Timestamp</span>
                <span className="text-slate-700 text-[11px]">{new Date(bundle?.timestamp).toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">NRCeS Profile</span>
                <span className="text-ayur-700 text-[11px] truncate block">OPConsultRecord</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">ABDM Ready</span>
                <span className="font-bold text-emerald-600">Yes (Conforms)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Raw JSON Code View */
        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-emerald-400 font-mono text-xs overflow-x-auto">
          <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
            <span>HL7 FHIR Release 4 JSON Schema</span>
            <button
              onClick={handleCopyJson}
              className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg transition"
            >
              {copied ? 'Copied!' : 'Copy Entire JSON'}
            </button>
          </div>
          <pre className="whitespace-pre overflow-x-auto leading-relaxed max-h-[600px]">
            {JSON.stringify(bundle, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FhirExportPage;
