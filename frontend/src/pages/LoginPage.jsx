import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCase } from '../context/CaseContext';
import { Stethoscope, User, Shield, Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

const roles = {
  doctor: {
    label: 'Doctor',
    subtitle: 'Open the clinical command center',
    badge: 'CLINICAL CARE',
    title: 'A clearer view of every patient story.',
    email: 'doctor@sih26047.local',
    password: 'doctor123',
    icon: Stethoscope,
    route: '/doctor/queue'
  },
  patient: {
    label: 'Patient',
    subtitle: 'Start or continue your care journey',
    badge: 'PATIENT CARE',
    title: 'Your story starts here.',
    email: 'patient@sih26047.local',
    password: 'patient123',
    icon: User,
    route: '/intake'
  },
  admin: {
    label: 'Hospital Admin',
    subtitle: 'Manage the AarogyaSaar system',
    badge: 'HOSPITAL OPERATIONS',
    title: 'A calmer way to manage the hospital.',
    email: 'admin@sih26047.local',
    password: 'admin123',
    icon: Shield,
    route: '/doctor/queue'
  }
};

const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const { loadDemoPatient } = useCase();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const chooseRole = (role) => {
    setSelectedRole(role);
    setEmail(roles[role]?.email || '');
    setPassword(roles[role]?.password || '');
    setError('');
  };

  const goAfterLogin = async (role, isDemo = false) => {
    // Always put the SIH demo workflow on its known-good consultation. This
    // prevents stale localStorage IDs such as AS-CON-2026-0004 from producing
    // 404s in the case/reconstruction screens.
    if (isDemo) {
      try { await loadDemoPatient(); } catch (seedError) {
        console.warn('Demo case seed skipped:', seedError?.message);
      }
    }
    navigate(roles[role].route);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setError('');
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result?.user?.role && result.user.role !== selectedRole) {
        throw new Error(`This account is not a ${roles[selectedRole].label} account.`);
      }
      await goAfterLogin(selectedRole, result?.isDemo === true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      const result = await demoLogin(role);
      await goAfterLogin(role, result?.isDemo === true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed. Please check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ayur-100 text-ayur-800 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-ayur-600" /> SIH26047 Prototype Access
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome to Aarogya<span className="text-ayur-600">Saar</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2">Choose how you want to continue</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(roles).map(([role, item]) => {
              const Icon = item.icon;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => chooseRole(role)}
                  className="text-left bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40 p-6 hover:-translate-y-1 hover:border-ayur-300 hover:shadow-xl transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-ayur-50 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-ayur-700" />
                  </div>
                  <div className="text-[10px] font-bold tracking-widest text-ayur-700 mb-1">{item.badge}</div>
                  <h2 className="text-lg font-extrabold text-slate-900">{item.label}</h2>
                  <p className="text-xs text-slate-500 mt-1 min-h-8">{item.subtitle}</p>
                  <div className="mt-5 text-sm font-bold text-ayur-700 flex items-center gap-1">Continue <ArrowRight className="w-4 h-4" /></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const role = roles[selectedRole];
  const RoleIcon = role.icon;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
        <div className="hidden lg:flex p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xl font-extrabold">
              <span className="text-emerald-300">♥</span> Aarogya<span className="text-emerald-300">Saar</span>
            </div>
            <div className="mt-20">
              <div className="text-[10px] tracking-[0.2em] font-bold text-emerald-300">{role.badge}</div>
              <h2 className="text-3xl font-extrabold leading-tight mt-3">{role.title}</h2>
              <p className="text-sm text-slate-300 mt-4">Secure access to the right AarogyaSaar workspace.</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">AI-assisted case taking • Evidence provenance • AYUSH interoperability</p>
        </div>

        <div className="p-6 sm:p-10">
          <button type="button" onClick={() => chooseRole(null)} className="text-xs font-bold text-slate-500 hover:text-ayur-700 mb-7">← Choose another role</button>

          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-xl bg-ayur-50 flex items-center justify-center"><RoleIcon className="w-5 h-5 text-ayur-700" /></div>
            <div>
              <div className="text-[10px] tracking-widest font-bold text-ayur-700">{role.label.toUpperCase()} SIGN IN</div>
              <h2 className="text-2xl font-extrabold text-slate-900">Welcome back</h2>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Instant 1-Click Demo Login</label>
            <button type="button" onClick={() => handleDemo(selectedRole)} disabled={loading} className="w-full py-3 rounded-xl border border-ayur-200 bg-ayur-50 hover:bg-ayur-100 text-ayur-900 font-bold text-sm transition-all disabled:opacity-50">
              Continue as {role.label} →
            </button>
          </div>

          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div><div className="relative flex justify-center text-xs uppercase font-medium"><span className="bg-white px-3 text-slate-400">Or use email credentials</span></div></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role.email} className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ayur-500" required /></div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ayur-500" required /></div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-xl bg-ayur-600 hover:bg-ayur-700 text-white font-bold text-sm shadow-md shadow-ayur-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span><ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-[11px] text-slate-400 text-center">Demo access is intended for SIH evaluation and prototype demonstration.</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
