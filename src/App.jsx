import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './components/pages/Home';
import Catch from './components/pages/Catch';
import Revenue from './components/pages/Revenue';
import About from './components/pages/About';
import Composition from './components/pages/Composition';
import ErrorBoundary from './components/ErrorBoundary';
import { useTheme } from './hooks/useTheme';
import { 
  AuthProvider, 
  ProtectedRoute, 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage, 
  ResetPasswordPage 
} from './auth';
import './styles/charts.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [selectedLandingSite, setSelectedLandingSite] = useState('all');
  const [currency, setCurrency] = useState('MZN');

  return (
    <AuthProvider>
      <ErrorBoundary>
        <Routes>
          {/* Public authentication routes */}
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <ProtectedRoute requireAuth={false}>
                <RegisterPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <ProtectedRoute requireAuth={false}>
                <ForgotPasswordPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <ProtectedRoute requireAuth={false}>
                <ResetPasswordPage />
              </ProtectedRoute>
            } 
          />

          {/* Protected application routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Layout
                  theme={theme}
                  toggleTheme={toggleTheme}
                  selectedLandingSite={selectedLandingSite}
                  setSelectedLandingSite={setSelectedLandingSite}
                  currency={currency}
                  setCurrency={setCurrency}
                >
                  <Routes>
                    <Route path="/" element={<Home theme={theme} district={selectedLandingSite} />} />
                    <Route
                      path="/catch"
                      element={<Catch theme={theme} landingSite={selectedLandingSite} />}
                    />
                    <Route
                      path="/revenue"
                      element={<Revenue theme={theme} landingSite={selectedLandingSite} currency={currency} />}
                    />
                    <Route path="/composition" element={<Composition />} />
                    <Route path="/about" element={<About />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
