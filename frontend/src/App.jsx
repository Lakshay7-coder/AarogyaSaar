import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useAuth } from "./context/AuthContext";
// 12 Screens
import LoginPage from './pages/LoginPage';
import PatientIntakePage from './pages/PatientIntakePage';
import AIInterviewPage from './pages/AIInterviewPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import CaseReconstructionPage from './pages/CaseReconstructionPage';
import EvidencePage from './pages/EvidencePage';
import CompletenessPage from './pages/CompletenessPage';
import TimelinePage from './pages/TimelinePage';
import AyushAssessmentPage from './pages/AyushAssessmentPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorVerificationPage from './pages/DoctorVerificationPage';
import FhirExportPage from './pages/FhirExportPage';
import ClinicalIntelligencePage from './pages/ClinicalIntelligencePage';


const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/70">Restoring secure session…</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onMenu={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-w-0">
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 overflow-x-hidden p-2 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CaseProvider>
        <Router>
          <Routes>
            {/* Screen 1: Login */}
            <Route
              path="/login"
              element={<LoginPage />}
            />

            {/* Screen 2: Patient Intake / Kiosk */}
            <Route
              path="/intake"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <PatientIntakePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 3: AI Voice Interview */}
            <Route
              path="/interview"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <AIInterviewPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 4: Document Upload & OCR */}
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <DocumentUploadPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 5: Clinical Case Reconstruction */}
            <Route
              path="/cases/reconstruction"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <CaseReconstructionPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 6: Evidence & Provenance */}
            <Route
              path="/evidence"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <EvidencePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 7: Completeness Engine */}
            <Route
              path="/completeness"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <CompletenessPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 8: Patient Timeline */}
            <Route
              path="/timeline"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <TimelinePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 9: AYUSH Assessment */}
            <Route
              path="/ayush"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <AyushAssessmentPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 10: Doctor Command Center */}
            <Route
              path="/doctor/queue"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <DoctorDashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 11: Doctor Verification */}
            <Route
              path="/doctor/verify"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <DoctorVerificationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* ZIP2 enhancement: Doctor 30-Second Clinical Intelligence */}
            <Route
              path="/doctor/intelligence"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <ClinicalIntelligencePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Screen 12: FHIR / ABDM Record */}
            <Route
              path="/fhir"
              element={
                <ProtectedRoute>
                  <AppLayout>
                  <FhirExportPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback default */}
            <Route path="*" element={<Navigate to="/doctor/queue" replace />} />
          </Routes>
        </Router>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;
