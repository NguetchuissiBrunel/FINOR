import { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { useDraggable } from '../hooks/useDraggable';
import { RubricsService, type RubricBalance } from '../lib';
import './Home.css';

export const Home = () => {
  const { installPrompt, isInstalled, handleInstall } = usePWA();
  const [showHint, setShowHint] = useState(false);
  const { style, handleMouseDown, isDragging } = useDraggable();
  const [rubrics, setRubrics] = useState<RubricBalance[]>([]);
  const [loadingRubrics, setLoadingRubrics] = useState(true);

  // Detect if on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        const listRes = await RubricsService.listRubricsRubricsGet();
        const items = listRes.data || [];
        const balances = await Promise.all(
          items.map(async (r) => {
            const bal = await RubricsService.getRubricBalanceRubricsRubricIdBalanceGet(r.id);
            return bal.data;
          })
        );
        setRubrics(balances.filter((b): b is RubricBalance => b != null));
      } catch {
        // silently fail — section just won't show
      } finally {
        setLoadingRubrics(false);
      }
    };
    fetchRubrics();
  }, []);

  const projectSvgIcons = [
    // Education
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>,
    // Health
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>,
    // Agriculture
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      <circle cx="12" cy="12" r="9" />
    </svg>,
    // Roads
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>,
    // Water
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 6v6l4 2" />
    </svg>,
    // Energy
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>,
    // Construction
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m14 0H5m-2 0H3" />
      <path d="M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
    </svg>,
    // Environment
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12.75l6 6 9-13.5" />
    </svg>,
  ];

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

      {/* Projects Section */}
      <section id="projets" className="projects-section">
        <div className="projects-header">
          <h2>Nos <span className="text-gold">Rubriques</span> Actives</h2>
          <p className="text-muted">Chaque franc investi est affecté à une rubrique budgétaire précise, auditée et tracée.</p>
        </div>

        {loadingRubrics ? (
          <div className="projects-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="project-card project-card-skeleton">
                <div className="skeleton-icon"></div>
                <div className="skeleton-title"></div>
                <div className="skeleton-bar"></div>
                <div className="skeleton-stat"></div>
              </div>
            ))}
          </div>
        ) : rubrics.length === 0 ? (
          <div className="projects-empty">
            <p className="text-muted text-center">Aucun projet disponible pour le moment.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {rubrics.map((r, i) => {
              return (
                <div key={r.rubric_id} className="project-card">
                  <div className="project-card-icon">
                    {projectSvgIcons[i % projectSvgIcons.length]}
                  </div>
                  <h3 className="project-card-name">{r.rubric_name}</h3>

                  <div className="project-stats">
                    <div className="project-stat">
                      <span className="stat-label">Fonds collectés</span>
                      <span className="stat-value text-gold">{r.total_invested.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="project-stat">
                      <span className="stat-label">Solde disponible</span>
                      <span className="stat-value">{r.current_balance.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                  <a href="/investir" className="btn btn-secondary project-invest-btn">
                    Investir dans ce projet →
                  </a>
                </div>
              );
            })}
          </div>
        )}
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
          <div
            className={`pwa-hint-card animation-slide-up ${isDragging ? 'dragging' : ''}`}
            style={style}
            onClick={e => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="pwa-hint-header drp-handle">
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
