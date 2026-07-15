import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { Demo } from './components/Demo';
import { Docs } from './components/Docs';
import './App.css';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [githubStars, setGithubStars] = useState('Stars');

  useEffect(() => {
    fetch('https://api.github.com/repos/abdul-karim-mia/universal-embed-player')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setGithubStars(`${d.stargazers_count} Stars`))
      .catch(() => setGithubStars('Stars'));
  }, []);

  const navigateTo = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('main-content')?.focus();
  };

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link" style={{
        position: 'absolute',
        top: '-100%',
        left: '8px',
        padding: '8px 16px',
        background: 'var(--primary)',
        color: '#000',
        borderRadius: '0 0 8px 8px',
        zIndex: 1000,
        fontWeight: 600,
        textDecoration: 'none',
      }} onFocus={(e) => e.target.style.top = '0'} onBlur={(e) => e.target.style.top = '-100%'}>
        Skip to content
      </a>
      <Navbar activePage={activePage} onNavigate={navigateTo} githubStars={githubStars} />
      <main id="main-content" tabIndex={-1}>
        {activePage === 'home' && <Home onNavigate={navigateTo} />}
        {activePage === 'demo' && <Demo />}
        {activePage === 'docs' && <Docs />}
      </main>
      <Footer onNavigate={navigateTo} />
    </div>
  );
}
