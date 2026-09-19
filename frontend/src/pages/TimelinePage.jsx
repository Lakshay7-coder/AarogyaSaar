import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCase } from '../context/CaseContext';
import {
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  FileText,
  Mic,
  Activity,
  Stethoscope,
  Scan,
  Flower2
} from 'lucide-react';

const TimelinePage = () => {
  const navigate = useNavigate();
  const { activePatientId, activeConsultationId, activePatient } = useCase();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', eventType: 'DOCTOR_VERIFIED' });

  const fetchTimeline = async () => {
    if (!activePatientId && !activeConsultationId) return;
    setLoading(true);
    try {
      const idToQuery = activePatientId || activeConsultationId;
      const res = await api.get(`/timeline/${idToQuery}`);
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [activePatientId, activeConsultationId]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    try {
      const res = await api.post('/timeline', {
        patientId: activePatientId,
        consultationId: activeConsultationId,
        title: newEvent.title,
        description: newEvent.description,
        eventType: newEvent.eventType,
        source: 'DOCTOR_ENTERED',
        badgeColor: 'emerald'
      });
      if (res.data.success) {
        setShowAddModal(false);
        setNewEvent({ title: '', description: '', eventType: 'DOCTOR_VERIFIED' });
        fetchTimeline();
      }
    } catch (err) {
      alert('Failed to add timeline event: ' + err.message);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'INTAKE':
        return Activity;
      case 'INTERVIEW':
        return Mic;
      case 'DOCUMENT_UPLOAD':
      case 'OCR_COMPLETED':
        return Scan;
      case 'RECONSTRUCTION':
        return FileText;
      case 'AYUSH_ASSESSMENT':
        return Flower2;
      case 'DOCTOR_VERIFIED':
      case 'FINALIZED':
        return Stethoscope;
      default:
        return Clock;
    }
  };

  const getBadgeClass = (color) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'teal':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-ayur-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" /> Screen 8 of 12
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chronological Patient Journey Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time event ledger tracking every step from intake kiosk to clinical finalization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event Note</span>
          </button>

          <button
            onClick={() => navigate('/ayush')}
            className="px-5 py-2.5 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white text-xs font-bold shadow-md shadow-ayur-600/20 inline-flex items-center gap-2 transition"
          >
            <span>Step 9: AYUSH Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {loading && events.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Loading chronological timeline...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No timeline events recorded yet.</div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8">
            {events.map((event, idx) => {
              const Icon = getEventIcon(event.eventType);
              const dateObj = new Date(event.timestamp);

              return (
                <div key={idx} className="relative group">
                  {/* Timeline Dot with Icon */}
                  <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-white border-2 border-ayur-600 text-ayur-700 flex items-center justify-center shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Event Card */}
                  <div className="bg-slate-50/80 hover:bg-slate-50 transition-colors p-4 rounded-xl border border-slate-200/90">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBadgeClass(event.badgeColor)}`}>
                        {event.eventType.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} •{' '}
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1">{event.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Source: <strong className="text-slate-600">{event.source}</strong></span>
                      <span>Case: {event.consultationId}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Timeline Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Add Clinical Timeline Note</h2>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Teleconsultation Check-in"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type</label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  <option value="DOCTOR_VERIFIED">Doctor Verified Note</option>
                  <option value="LAB_RESULT">Diagnostic Lab Result</option>
                  <option value="AYUSH_ASSESSMENT">AYUSH Assessment</option>
                  <option value="SYSTEM">System Event</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Clinical observation or patient progress note..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-ayur-600 text-white rounded-lg hover:bg-ayur-700 shadow-sm"
                >
                  Save Timeline Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
