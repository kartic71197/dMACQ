import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// StrictMode intentionally double-invokes effects in development to surface
// side-effect bugs — remove for production profiling if needed
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
