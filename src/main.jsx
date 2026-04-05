import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmpresaDashboard from './pages/EmpresaDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CVPreviewPage from './pages/CVPreviewPage';
import VagasPage from './pages/VagasPage';
import MinhasCandidaturasPage from './pages/MinhasCandidaturasPage';
import LandingPage from './pages/LandingPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import LegalPage from './pages/LegalPage';
import CVWizardPage from './pages/CVWizardPage';
import CandidateStats from './pages/CandidateStats';
import PremiumOfferPage from './pages/PremiumOfferPage';
import TrackerWrapper from './components/layout/TrackerWrapper';
import CookieBanner from './components/ui/CookieBanner';
import NotificationPrompt from './components/notifications/NotificationPrompt';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Registro do PWA Service Worker (Vite PWA Plugin virtal module)
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log("Nova versão disponível! Atualize para carregar.");
  },
  onOfflineReady() {
    console.log("O Aplicativo está pronto para uso offline!");
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <TrackerWrapper />
      <CookieBanner />
      <NotificationPrompt />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
        <Route path="/cv-wizard" element={
          <ProtectedRoute allowedRoles={['candidato']}>
            <CVWizardPage />
          </ProtectedRoute>
        } />
        <Route path="/estatisticas" element={
          <ProtectedRoute allowedRoles={['candidato']}>
            <CandidateStats />
          </ProtectedRoute>
        } />
        <Route path="/oferta-premium" element={
          <ProtectedRoute allowedRoles={['candidato']}>
            <PremiumOfferPage />
          </ProtectedRoute>
        } />

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
);
