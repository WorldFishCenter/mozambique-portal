import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@tabler/core/dist/css/tabler.min.css';
import '@tabler/core/dist/css/tabler-themes.min.css';
import '@tabler/core/dist/js/tabler.min.js';

// Apply fixed theme settings on initialization
const html = document.documentElement;
html.setAttribute('data-bs-theme-primary', 'cyan');
html.setAttribute('data-bs-theme-base', 'neutral');
html.setAttribute('data-bs-theme-radius', '1.5');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
