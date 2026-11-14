import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initHighContrast } from './utils/highContrast.ts';

// Register service worker in production builds; clean up stale workers in dev so launches never serve outdated assets
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((reg) => reg.unregister().catch(() => {}));
    })
    .catch(() => {});
}

// Initialize High-Contrast state if enabled
initHighContrast();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
