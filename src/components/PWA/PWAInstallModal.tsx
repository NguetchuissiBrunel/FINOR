import { useState, useEffect } from 'react';
import { usePWA } from '../../hooks/usePWA';
import './PWAInstallModal.css';

export const PWAInstallModal = () => {
  const { installPrompt, isInstalled, handleInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show modal if installable and not dismissed this session
    const isDismissed = sessionStorage.getItem('pwa_modal_dismissed');
    if (installPrompt && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 3000); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [installPrompt, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_modal_dismissed', 'true');
  };

  const onInstallClick = async () => {
    await handleInstall();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="pwa-modal-overlay">
      <div className="pwa-modal-card animation-slide-up">
        <button className="close-btn" onClick={handleDismiss}>&times;</button>
        
        <div className="pwa-modal-header">
          <div className="pwa-modal-logo">
            <img src="/logo.png" alt="FINOR" />
          </div>
          <h2>Installer FINOR</h2>
        </div>

        <div className="pwa-modal-body">
          <p>Accédez à vos finances en un clic ! Installez l'application sur votre écran d'accueil pour une expérience fluide et sécurisée.</p>
          <ul className="pwa-benefits">
            <li>✓ Accès rapide (icône bureau)</li>
            <li>✓ Navigation plein écran</li>
            <li>✓ Performance optimisée</li>
          </ul>
        </div>

        <div className="pwa-modal-actions">
          <button className="btn btn-primary full-width" onClick={onInstallClick}>
            Installer maintenant
          </button>
          <button className="btn btn-link" onClick={handleDismiss}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
};
