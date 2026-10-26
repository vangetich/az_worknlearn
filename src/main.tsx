import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initHighContrast } from './utils/highContrast.ts';

// Register service worker for offline caching of Azure Curriculum, flashcards, and quizzes
registerSW({ immediate: true });

// Initialize High-Contrast state if enabled
initHighContrast();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
