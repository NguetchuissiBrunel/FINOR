import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src="/logo.png" alt="FINOR" className="navbar-logo-icon" />
          <div className="brand-name">
            <span className="brand-fin">FIN</span><span className="brand-or">OR</span>
          </div>
        </Link>
        
        {/* Desktop Links */}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Accueil</Link>
          <Link to="/investir" className={`nav-link ${isActive('/investir')}`}>Investir</Link>
          <Link to="/investisseur/login" className={`nav-link ${isActive('/investisseur/login')}`}>Mon Espace</Link>
          <Link to="/tresorier/login" className={`btn btn-secondary nav-btn ${isActive('/tresorier/login')}`}>Espace Trésorier</Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle Menu">
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div className={`mobile-dropdown ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link to="/" className={`mobile-nav-link ${isActive('/')}`} onClick={closeMenu}>Accueil</Link>
        <Link to="/investir" className={`mobile-nav-link ${isActive('/investir')}`} onClick={closeMenu}>Investir</Link>
        <Link to="/investisseur/login" className={`mobile-nav-link ${isActive('/investisseur/login')}`} onClick={closeMenu}>Mon Espace</Link>
        <Link to="/tresorier/login" className={`mobile-nav-btn btn btn-secondary ${isActive('/tresorier/login')}`} onClick={closeMenu}>Espace Trésorier</Link>
      </div>
    </nav>
  );
};
