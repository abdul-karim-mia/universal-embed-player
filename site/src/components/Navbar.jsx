import { useState } from 'react';

const pages = [
  { key: 'home', label: 'Home' },
  { key: 'demo', label: 'Live Demo' },
  { key: 'docs', label: 'Documentation' },
];

export function Navbar({ activePage, onNavigate, githubStars }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (key) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  return (
    <header className="navbar" role="banner">
      <nav className="container navbar-container" aria-label="Main navigation">
        <span
          className="brand"
          onClick={() => handleNav('home')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleNav('home'); }}
          role="button"
          tabIndex={0}
          aria-label="Universal Embed Player – Home"
        >
          <svg viewBox="0 0 128 128" width="32" height="32" className="brand-logo" aria-hidden="true">
            <defs>
              <linearGradient id="logo-bg-nav" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8185f4" />
                <stop offset="100%" stopColor="#5b5fe0" />
              </linearGradient>
            </defs>
            <rect width="128" height="128" rx="28" fill="url(#logo-bg-nav)" />
            <polygon points="52,36 52,92 100,64" fill="#ffffff" />
          </svg>
          <span className="brand-name">UEP</span>
        </span>

        <button
          className="mobile-menu-btn"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>

        <div className={`nav-links ${mobileOpen ? 'active' : ''}`} role="menubar">
          {pages.map((p) => (
            <span
              key={p.key}
              className={`nav-link ${activePage === p.key ? 'active' : ''}`}
              onClick={() => handleNav(p.key)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNav(p.key); }}
              role="menuitem"
              tabIndex={0}
            >
              {p.label}
            </span>
          ))}
          {mobileOpen && (
            <div className="nav-actions-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <a href="https://github.com/abdul-karim-mia/universal-embed-player" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
                </svg>
                GitHub <span className="stars-pill">{githubStars}</span>
              </a>
              <a href="https://www.npmjs.com/package/universal-embed-player" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                npm install
              </a>
            </div>
          )}
        </div>

        <div className="nav-actions">
          <a href="https://github.com/abdul-karim-mia/universal-embed-player" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
            </svg>
            GitHub <span className="stars-pill">{githubStars}</span>
          </a>
          <a href="https://www.npmjs.com/package/universal-embed-player" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            npm install
          </a>
        </div>
      </nav>
    </header>
  );
}
