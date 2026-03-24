import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import EmpresaDashboard from './pages/EmpresaDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CVPreviewPage from './pages/CVPreviewPage';
import VagasPage from './pages/VagasPage';
import MinhasCandidaturasPage from './pages/MinhasCandidaturasPage';
import PaymentPage from './pages/PaymentPage';
import LandingPage from './pages/LandingPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import LegalPage from './pages/LegalPage';
import CookieBanner from './components/ui/CookieBanner';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <CookieBanner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['candidato']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/cv-preview" element={
            <ProtectedRoute allowedRoles={['candidato', 'empresa', 'admin']}>
              <CVPreviewPage />
            </ProtectedRoute>
          } />
          <Route path="/cv-preview/:userId" element={
            <ProtectedRoute allowedRoles={['empresa', 'admin']}>
              <CVPreviewPage />
            </ProtectedRoute>
          } />
           <Route path="/vagas" element={
            <ProtectedRoute allowedRoles={['candidato']}>
              <VagasPage />
            </ProtectedRoute>
          } />
          <Route path="/minhas-candidaturas" element={
            <ProtectedRoute allowedRoles={['candidato']}>
              <MinhasCandidaturasPage />
            </ProtectedRoute>
          } />
          {/* <Route path="/pagamento" element={
            <ProtectedRoute allowedRoles={['candidato']}>
              <PaymentPage />
            </ProtectedRoute>
          } /> */}
          <Route path="/empresa" element={
            <ProtectedRoute allowedRoles={['empresa']}>
              <EmpresaDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'master']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
