import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utilities.css'
import App from './App.tsx'
import './i18n.ts'
import { OpenAPI } from './lib'

// Configure the generated API client
// Always use the absolute backend URL — no proxy needed.
OpenAPI.BASE = 'https://finor-backend.onrender.com';
OpenAPI.TOKEN = async () => {
  return sessionStorage.getItem('treasurerToken') || ''
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW Registered', reg))
      .catch(err => console.log('SW Error', err));
  });
}
