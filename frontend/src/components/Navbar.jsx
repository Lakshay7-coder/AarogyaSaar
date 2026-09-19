import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCase } from '../context/CaseContext';
import { usePatientLanguage, t } from '../patientI18n';
import {
  Activity,
  Menu,
  Shield,
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCw
} from 'lucide-react';

const Navbar = ({ onMenu = () => {} }) => {
  const { user, logout } = useAuth();
  const { activeConsultationId, activePatient, loadDemoPatient, loadingCase, refreshCase } = useCase();
  const navigate = useNavigate();
  const location = useLocation();
  const isPatientRoute = ['/intake', '/interview', '/documents'].includes(location.pathname);
  const uiLanguage = usePatientLanguage(activePatient?.language || 'English');
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await loadDemoPatient();
      navigate('/cases/reconstruction');
    } catch (err) {
      alert('Could not seed demo patient: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 min-w-0">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open navigation"
            className="md:hidden shrink-0 p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ayur-700 via-ayur-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-ayur-600/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Aarogya<span className="text-ayur-600">Saar</span>
                </span>
                <span className="bg-ayur-100 text-ayur-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  SIH26047
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-none">
                {isPatientRoute && uiLanguage === 'Hindi' ? 'AI मेडिकल जानकारी और आसान केस प्रक्रिया' : 'AI Clinical Intake & AYUSH Interoperability'}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Active Case Pill & ABDM Sandbox Badge */}
        <div className="hidden md:flex items-center gap-3">
          {/* ABDM Readiness Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <Shield className="w-3.5 h-3.5 text-clinical-600" />
            <span>ABDM / FHIR R4 Ready</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {/* Active Patient Indicator */}
          {activePatient ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs text-emerald-900 font-medium">
              <span className="font-bold text-emerald-700">{activePatient.name}</span>
              <span className="text-emerald-500">•</span>
              <span className="font-mono text-emerald-600">{activeConsultationId}</span>
              <button
                onClick={refreshCase}
                title={isPatientRoute && uiLanguage === 'Hindi' ? 'केस की जानकारी फिर से लोड करें' : 'Refresh case data'}
                className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">{isPatientRoute && uiLanguage === 'Hindi' ? 'कोई सक्रिय मरीज़ नहीं चुना गया' : 'No Active Patient Selected'}</div>
          )}
        </div>

        {/* Right Controls: Demo Loader, User Role, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* 1-Click SIH Demo Patient Seeder */}
          <button
            onClick={handleSeedDemo}
            disabled={seeding || loadingCase}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-sm shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            title={isPatientRoute && uiLanguage === 'Hindi' ? 'SIH डेमो मरीज़ लोड करें' : 'Load standard SIH patient demo case'}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{seeding ? (uiLanguage === 'Hindi' ? 'लोड हो रहा है...' : 'Seeding...') : (uiLanguage === 'Hindi' ? 'SIH डेमो केस लोड करें' : 'Load SIH Demo Case')}</span>
          </button>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden lg:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</div>
                <div className="text-[10px] uppercase font-bold text-ayur-600">{user.role}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
