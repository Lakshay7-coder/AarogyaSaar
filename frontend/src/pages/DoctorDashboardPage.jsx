import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import {
  Stethoscope,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Activity,
  Sparkles,
  ExternalLink,
  RotateCw
} from 'lucide-react';

const DoctorDashboardPage = () => {
  const navigate = useNavigate();
  const { setActiveCase, loadDemoPatient } = useCase();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctor/queue');
      if (res.data.success) {
        setQueue(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctor queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenCase = (consultationId, patientId) => {
    setActiveCase(consultationId, patientId);
    navigate('/doctor/verify');
  };

  const filteredQueue = queue.filter((item) => {
    const name = item.patient?.name?.toLowerCase() || '';
    const id = item.consultation?.consultationId?.toLowerCase() || '';
    const matchesSearch = name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || item.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const totalPatients = queue.length;
  const pendingVerifications = queue.reduce((acc, curr) => acc + (curr.pendingVerificationCount || 0), 0);
  const highPriority = queue.filter((q) => q.priority === 'Urgent' || q.priority === 'High Risk').length;
  const finalizedCases = queue.filter((q) => q.status === 'finalized').length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" /> Screen 10 of 12
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Doctor Command Center & Triage Queue
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time outpatient consultation dashboard, clinical risk flags, and verification queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Refresh clinical queue"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-ayur-600' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/doctor/verify')}
            className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
          >
            <span>Open Verification Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Encounters</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalPatients}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active outpatient queue</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Pending Findings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{pendingVerifications}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting doctor sign-off</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">High Priority</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{highPriority}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Urgent clinical triage</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Finalized Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{finalizedCases}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">FHIR / ABDM export ready</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name, ID, or case..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ayur-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500">Triage:</span>
          {['ALL', 'Routine', 'Urgent', 'High Risk'].map((pri) => (
            <button
              key={pri}
              onClick={() => setFilterPriority(pri)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterPriority === pri
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pri}
            </button>
          ))}
        </div>
      </div>

      {/* Clinical Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4">Patient & ID</th>
                <th className="p-4">Chief Complaint</th>
                <th className="p-4">Triage Priority</th>
                <th className="p-4">Case Status</th>
                <th className="p-4">Pending Verifications</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">No patient consultations in this filter queue.</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const c = item.consultation;
                  const p = item.patient;

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{p?.name || 'Walk-in Patient'}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {p?.patientId || c.patientId} • {p?.age || 52} Y, {p?.gender || 'Male'}
                        </div>
                      </td>

                      <td className="p-4 max-w-xs">
                        <p className="font-medium text-slate-800 line-clamp-2">
                          {c.chiefComplaint}
                        </p>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.priority === 'High Risk'
                              ? 'bg-rose-100 text-rose-800'
                              : c.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              c.status === 'finalized'
                                ? 'bg-emerald-500'
                                : c.status === 'under_review'
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                            }`}
                          ></span>
                          <span className="capitalize">{c.status?.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        {item.pendingVerificationCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {item.pendingVerificationCount} findings to verify
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All Verified
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenCase(c.consultationId, p?.patientId || c.patientId)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-ayur-600 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5"
                        >
                          <span>Review Case</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
