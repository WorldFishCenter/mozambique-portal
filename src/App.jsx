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
import './styles/charts.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [selectedLandingSite, setSelectedLandingSite] = useState('all');
  const [currency, setCurrency] = useState('MT');

  return (
    <Layout
      theme={theme}
      toggleTheme={toggleTheme}
      selectedLandingSite={selectedLandingSite}
      setSelectedLandingSite={setSelectedLandingSite}
      currency={currency}
      setCurrency={setCurrency}
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
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
