import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import {
  reportReactShellReady,
  startFrontendPerformanceMeasurement,
} from './lib/frontendPerformance';
import { captureLpUtmFromUrl, installUtmLinkHandler, saveUtmFromUrl } from './utils/utm';
import './index.css';

startFrontendPerformanceMeasurement();
saveUtmFromUrl();
captureLpUtmFromUrl();
installUtmLinkHandler();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);

reportReactShellReady();
