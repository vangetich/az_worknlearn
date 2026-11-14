import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initHighContrast } from './utils/highContrast.ts';

// Unregister any stale service workers and clear outdated Workbox precaches so preview and shared URLs always load fresh assets
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((reg) => reg.unregister().catch(() => {}));
    })
    .catch(() => {});
}

if (typeof window !== 'undefined' && 'caches' in window) {
  window.caches
    .keys()
    .then((keys) => {
      keys.forEach((key) => {
        if (key.includes('workbox') || key.includes('precache')) {
          window.caches.delete(key).catch(() => {});
        }
      });
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
