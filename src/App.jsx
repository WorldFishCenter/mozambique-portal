import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './components/pages/Home';
import Catch from './components/pages/Catch';
import Revenue from './components/pages/Revenue';
import About from './components/pages/About';
import Composition from './components/pages/Composition';
import Login from './components/pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { useTheme } from './hooks/useTheme';
import './styles/charts.css';

const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent({ isAuthenticated, onLogin, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [selectedLandingSite, setSelectedLandingSite] = useState('all');
  const [currency, setCurrency] = useState('MZN');

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={onLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout
      theme={theme}
      toggleTheme={toggleTheme}
      selectedLandingSite={selectedLandingSite}
      setSelectedLandingSite={setSelectedLandingSite}
      currency={currency}
      setCurrency={setCurrency}
      onLogout={onLogout}
    >
      <ErrorBoundary>
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
          <Route path="/Composition" element={<Composition />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('isAuthenticated') === 'true'
  );

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <AppContent
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
}

export default App;
