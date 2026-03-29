import { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import './Home.css';

export const Home = () => {
  const { installPrompt, isInstalled, handleInstall } = usePWA();
  const [showHint, setShowHint] = useState(false);
  
  // Detect if on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="home-page">
      <header className="hero-section text-center">
        <h1 className="hero-title">
          Investissez dans l'<span className="text-gold">Avenir</span>
        </h1>
        <p className="hero-subtitle text-muted">
          La plateforme sécurisée et transparente pour financer nos projets communs.
        </p>
        <div className="hero-actions">
          <a href="/investir" className="btn btn-primary">
            Commencer à investir
          </a>
          <a href="#projets" className="btn btn-secondary">
            Découvrir les projets
          </a>
        </div>
      </header>
      
      <section className="features-section">
        <h2 className="text-center">Pourquoi investir avec nous ?</h2>
        <div className="cards-grid">
          <div className="card">
            <h3 className="text-gold">Transparence Totale</h3>
            <p>Suivez l'utilisation de vos fonds en temps réel grâce à notre tableau de bord public.</p>
          </div>
          <div className="card">
            <h3 className="text-gold">Projets Sécurisés</h3>
            <p>Chaque investissement est alloué à des rubriques validées (Route, Eau, etc.).</p>
          </div>
          <div className="card">
            <h3 className="text-gold">Rendement Impactant</h3>
            <p>Contribuez directement au développement de la communauté avec un retour mesurable.</p>
          </div>
        </div>
      </section>

      {/* Persistent Installation Section */}
      <section className="install-section">
        <div className="card install-card">
          <div className="install-content">
            <div className="install-text">
              <h3>FinSecur sur votre Mobile</h3>
              <p className="text-muted">Installez l'application pour un accès rapide et une expérience plein écran, même hors ligne.</p>
            </div>
            
            <div className="install-actions">
              {isInstalled ? (
                <div className="installed-badge">
                  <span className="text-gold">✓ Application Installée</span>
                </div>
              ) : isIOS ? (
                <div className="ios-guide">
                  <p className="text-sm">Appuyez sur <span className="text-gold">Partager</span> puis <span className="text-gold">Sur l'écran d'accueil</span></p>
                </div>
              ) : (
                <button 
                  className="btn btn-primary btn-pwa-main" 
                  onClick={() => {
                    if (installPrompt) {
                      handleInstall();
                    } else {
                      setShowHint(true);
                    }
                  }}
                >
                  Télécharger l'App
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Styled Popup (Hint Modal) */}
      {showHint && (
        <div className="pwa-hint-overlay" onClick={() => setShowHint(false)}>
          <div className="pwa-hint-card animation-slide-up" onClick={e => e.stopPropagation()}>
            <div className="pwa-hint-header">
              <div className="hint-icon">💡</div>
              <h3>Installation Manuelle</h3>
            </div>
            <div className="pwa-hint-body">
              <p>L'installation automatique est temporairement indisponible sur votre navigateur actuel.</p>
              <div className="hint-steps">
                <div className="hint-step">
                  <span className="step-num">1</span>
                  <p>Regardez tout à droite dans votre <strong>barre d'adresse</strong> ↗️</p>
                </div>
                <div className="hint-step">
                  <span className="step-num">2</span>
                  <p>Cliquez sur l'icône "Installer l'application" (ou via le menu principal du navigateur).</p>
                </div>
              </div>
              <p className="retry-msg text-muted text-sm">Réessayez ultérieurement ou contactez le support si le problème persiste.</p>
            </div>
            <button className="btn btn-primary full-width" onClick={() => setShowHint(false)}>
              D'accord, j'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
