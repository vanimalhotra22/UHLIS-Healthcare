import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';

// --- DYNAMIC API ROUTING PATCH ---
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string' && input.startsWith('http://localhost:8000')) {
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    input = input.replace('http://localhost:8000', apiURL);
  }
  return originalFetch(input, init);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);