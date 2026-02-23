import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Tabler CSS removed in favor of Tailwind/Shadcn
import App from './App';
import './globals.css';

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
