import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useCase } from '../context/CaseContext';
import { usePatientLanguage } from '../patientI18n';
import {
  LogIn,
  ClipboardList,
  Mic,
  FileUp,
  Brain,
  Layers,
  Gauge,
  Clock,
  Flower2,
  Stethoscope,
  CheckCheck,
  Share2,
  BrainCircuit
} from 'lucide-react';

const navItems = [
  { step: 1, name: 'Login & Auth', hi: 'लॉगिन और सुरक्षा', path: '/login', icon: LogIn, key: 'AUTH' },
  { step: 2, name: 'Patient Intake / Kiosk', hi: 'मरीज़ की जानकारी / कियोस्क', path: '/intake', icon: ClipboardList, key: 'INTAKE' },
  { step: 3, name: 'AI Voice Interview', hi: 'AI आवाज़ बातचीत', path: '/interview', icon: Mic, key: 'INTERVIEW' },
  { step: 4, name: 'Document Upload & OCR', hi: 'दस्तावेज़ अपलोड और OCR', path: '/documents', icon: FileUp, key: 'OCR' },
  { step: 5, name: 'Case Reconstruction', hi: 'केस का पुनर्निर्माण', path: '/cases/reconstruction', icon: Brain, key: 'RECONSTRUCTION' },
  { step: 6, name: 'Evidence & Provenance', hi: 'साक्ष्य और स्रोत', path: '/evidence', icon: Layers, key: 'EVIDENCE' },
  { step: 7, name: 'Completeness Engine', hi: 'जानकारी की पूर्णता', path: '/completeness', icon: Gauge, key: 'COMPLETENESS' },
  { step: 8, name: 'Patient Timeline', hi: 'मरीज़ की समयरेखा', path: '/timeline', icon: Clock, key: 'TIMELINE' },
  { step: 9, name: 'AYUSH Assessment', hi: 'आयुष आकलन', path: '/ayush', icon: Flower2, key: 'AYUSH' },
  { step: 10, name: 'Doctor Command Center', hi: 'डॉक्टर कमांड सेंटर', path: '/doctor/queue', icon: Stethoscope, key: 'QUEUE' },
  { step: 11, name: 'Doctor Verification', hi: 'डॉक्टर सत्यापन', path: '/doctor/verify', icon: CheckCheck, key: 'VERIFICATION' },
  { step: 12, name: 'FHIR / ABDM Record', hi: 'FHIR / ABDM रिकॉर्ड', path: '/fhir', icon: Share2, key: 'FHIR' },
  { step: 13, name: 'Clinical Intelligence', hi: 'क्लिनिकल इंटेलिजेंस', path: '/doctor/intelligence', icon: BrainCircuit, key: 'INTELLIGENCE' },
];

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const { activeConsultation } = useCase();
  const location = useLocation();
  const isPatientRoute = ['/intake', '/interview', '/documents'].includes(location.pathname);
  const uiLanguage = usePatientLanguage('English');
  const completedSteps = activeConsultation?.completedSteps || [];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 top-16 z-40 bg-slate-950/30 md:hidden"
        />
      )}
      <aside className={`w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between md:static md:translate-x-0 md:flex ${
        mobileOpen
          ? 'fixed left-0 top-16 bottom-0 z-50 flex translate-x-0 shadow-2xl overflow-y-auto'
          : 'fixed left-0 top-16 bottom-0 z-50 hidden -translate-x-full overflow-y-auto'
      }`}>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-3">
          {isPatientRoute && uiLanguage === 'Hindi' ? 'मरीज़ की क्लिनिकल प्रक्रिया' : '12-Screen Clinical Journey + Intelligence'}
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCompleted = completedSteps.includes(item.key) || (item.step === 1);

            return (
              <NavLink
                key={item.step}
                onClick={onClose}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-ayur-600 text-white shadow-sm shadow-ayur-600/30'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-white text-ayur-700'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.step}
                      </span>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{isPatientRoute && uiLanguage === 'Hindi' ? item.hi : item.name}</span>
                    </div>

                    {isCompleted && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Step completed"></span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Clinical Disclaimer Box */}
      <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-700 mb-0.5">{isPatientRoute && uiLanguage === 'Hindi' ? 'क्लिनिकल सहायता' : 'Clinical Decision Support'}</p>
        <p className="leading-relaxed">
          {isPatientRoute && uiLanguage === 'Hindi' ? 'AI से मिली जानकारी को स्थायी FHIR रिकॉर्ड में जोड़ने से पहले डॉक्टर की जाँच ज़रूरी है।' : 'AI inferences require physician verification before inclusion in permanent FHIR health records.'}
        </p>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
