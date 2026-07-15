export function Footer({ onNavigate }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-grid">
        <div className="footer-column">
          <span
            className="footer-brand"
            onClick={() => onNavigate('home')}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('home'); }}
            role="button"
            tabIndex={0}
            aria-label="Universal Embed Player – Home"
          >
            <svg viewBox="0 0 128 128" width="24" height="24" aria-hidden="true">
              <rect width="128" height="128" rx="28" fill="#8185f4" />
              <polygon points="52,36 52,92 100,64" fill="#ffffff" />
            </svg>
            <span className="brand-name" style={{ fontSize: '1.2rem' }}>Universal Embed Player</span>
          </span>
          <p className="footer-desc">
            A zero-dependency, framework-agnostic video embed library. One URL in, one unified player out. MIT licensed.
          </p>
        </div>

        <div className="footer-column">
          <h4 className="footer-title">Product</h4>
          <nav className="footer-links" aria-label="Footer product links">
            <span className="footer-link" onClick={() => onNavigate('home')} onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('home'); }} role="button" tabIndex={0}>Home</span>
            <span className="footer-link" onClick={() => onNavigate('demo')} onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('demo'); }} role="button" tabIndex={0}>Live Demo</span>
            <span className="footer-link" onClick={() => onNavigate('docs')} onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('docs'); }} role="button" tabIndex={0}>Documentation</span>
          </nav>
        </div>

        <div className="footer-column">
          <h4 className="footer-title">Resources</h4>
          <nav className="footer-links" aria-label="Footer resource links">
            <a href="https://github.com/abdul-karim-mia/universal-embed-player" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub Repository</a>
            <a href="https://github.com/abdul-karim-mia/universal-embed-player/issues" target="_blank" rel="noopener noreferrer" className="footer-link">Issue Tracker</a>
            <a href="https://www.npmjs.com/package/universal-embed-player" target="_blank" rel="noopener noreferrer" className="footer-link">npm Package</a>
          </nav>
        </div>

        <div className="footer-column">
          <h4 className="footer-title">Get Started</h4>
          <div className="footer-links">
            <a href="https://www.npmjs.com/package/universal-embed-player" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', textAlign: 'center' }} target="_blank" rel="noopener noreferrer">
              npm install
            </a>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dark)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              npm i universal-embed-player
            </code>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>&copy; {year} Universal Embed Player. Created by <a href="https://abdulkarimmia.in" target="_blank" rel="noopener noreferrer">Abdul karim mia</a>. MIT License.</span>
        <div className="footer-bottom-links">
          <a href="https://github.com/abdul-karim-mia/universal-embed-player/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.8rem' }}>
            MIT License
          </a>
        </div>
      </div>
    </footer>
  );
}
