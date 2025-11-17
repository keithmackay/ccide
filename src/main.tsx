import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/index.css';

// Global error handler to suppress external script errors
window.addEventListener('error', (event) => {
  // Check if error is from browser extension or external script
  const isExternalError =
    event.filename?.includes('container.js') ||
    event.filename?.includes('chrome-extension://') ||
    event.filename?.includes('moz-extension://') ||
    event.message?.includes('merchantID') ||
    event.error?.stack?.includes('container.js');

  if (isExternalError) {
    console.warn('[Global] External script error suppressed (likely from browser extension):', event.message);
    event.preventDefault();
    return true;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const isExternalError =
    event.reason?.stack?.includes('container.js') ||
    event.reason?.stack?.includes('chrome-extension://') ||
    event.reason?.message?.includes('merchantID');

  if (isExternalError) {
    console.warn('[Global] External promise rejection suppressed (likely from browser extension):', event.reason);
    event.preventDefault();
    return true;
  }
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
