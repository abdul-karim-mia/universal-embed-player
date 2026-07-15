import { useState, useEffect, useRef } from 'react';

const providers = [
  { name: 'YouTube', color: '#ff4444', bg: 'rgba(255,0,0,0.1)', icon: '▶' },
  { name: 'Vimeo', color: '#00adef', bg: 'rgba(0,173,239,0.1)', icon: '▶' },
  { name: 'HLS', color: 'var(--accent)', bg: 'rgba(255,255,255,0.05)', icon: 'H' },
  { name: 'DASH', color: 'var(--primary)', bg: 'rgba(255,255,255,0.05)', icon: 'D' },
  { name: 'Dropbox', color: '#0087ff', bg: 'rgba(0,135,255,0.1)', icon: 'D' },
  { name: 'Wistia', color: 'var(--accent)', bg: 'rgba(255,255,255,0.05)', icon: 'W' },
  { name: 'Cloudflare', color: '#ef8200', bg: 'rgba(239,130,0,0.1)', icon: 'CS' },
  { name: 'FastPix', color: 'var(--primary)', bg: 'rgba(255,255,255,0.05)', icon: 'FP' },
  { name: 'JW Player', color: '#00c864', bg: 'rgba(0,200,100,0.1)', icon: 'JW' },
  { name: 'Kaltura', color: '#ff6464', bg: 'rgba(255,100,100,0.1)', icon: 'K' },
  { name: 'MP4/WebM', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', icon: 'MP4' },
  { name: 'Iframely', color: 'var(--text-dark)', bg: 'rgba(255,255,255,0.05)', icon: '?' },
];

const cycleProviders = ['YouTube', 'Vimeo', 'HLS', 'DASH', 'Dropbox', 'Cloudflare Stream', 'MP4'];

export function Home({ onNavigate }) {
  const [providerIdx, setProviderIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const intervalRef = useRef(null);

  const currentProvider = cycleProviders[providerIdx % cycleProviders.length];

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const togglePlay = () => {
    if (playing) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setPlaying(false);
    } else {
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          const next = p + 0.4;
          if (next >= 100) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setPlaying(false);
            return 100;
          }
          return next;
        });
      }, 100);
    }
  };

  const cycleProvider = () => {
    setProviderIdx((i) => i + 1);
    setProgress(15);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlaying(false);
  };

  const totalSec = 272;
  const curSec = Math.round(totalSec * (progress / 100));
  const timeStr = `${Math.floor(curSec / 60)}:${String(curSec % 60).padStart(2, '0')} / 4:32`;

  return (
    <div>
      <section className="section-hero" id="home" aria-label="Hero">
        <div className="hero-blob-container" aria-hidden="true">
          <div className="hero-blob-1" />
          <div className="hero-blob-2" />
          <div className="hero-blob-3" />
        </div>
        <div className="hero-ripple-container" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={`hero-ripple-circle circle-${i + 1}`} />
          ))}
        </div>

        <div className="container hero-container">
          <div className="hero-text-content">
            <div className="badge-container">
              <span className="hero-badge">&#9654; Zero Dependency Video Embed</span>
              <a href="https://abdulkarimmia.in" target="_blank" rel="noopener noreferrer" className="creator-badge-link" aria-label="Created by Abdul karim mia">
                <span className="creator-badge">By Abdul karim mia</span>
              </a>
            </div>
            <h1 className="hero-title">
              One URL In.<br />
              <span className="text-gradient">One Player Out.</span>
            </h1>
            <p className="hero-subtitle">
              Universal Embed Player is a framework-agnostic, zero-dependency JavaScript library. Drop in a video URL from <strong>any source</strong> &mdash; YouTube, Vimeo, HLS, DASH, Dropbox, MP4 &mdash; and get a unified, brand-minimized player with one function call.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onNavigate('demo')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
                Try Live Demo
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('docs')}>
                Read Documentation
              </button>
            </div>
            <div className="hero-bullets">
              <div className="bullet-item">
                <svg className="bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 5 12" /></svg>
                <span>Zero Runtime Deps</span>
              </div>
              <div className="bullet-item">
                <svg className="bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 5 12" /></svg>
                <span>Shadow DOM UI</span>
              </div>
              <div className="bullet-item">
                <svg className="bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 5 12" /></svg>
                <span>React &amp; Vue Adapters</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" role="img" aria-label="Player preview showing video playback controls">
            <div className="player-visual-wrapper glass">
              <div className="player-visual-header">
                <div className="window-controls" aria-hidden="true">
                  <span className="control control-red" onClick={() => { setProgress(15); setPlaying(false); clearInterval(intervalRef.current); intervalRef.current = null; }} style={{ cursor: 'pointer' }} title="Reset" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') { setProgress(15); setPlaying(false); clearInterval(intervalRef.current); intervalRef.current = null; } }} />
                  <span className="control control-yellow" onClick={togglePlay} style={{ cursor: 'pointer' }} title={playing ? 'Pause' : 'Play'} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') togglePlay(); }} />
                  <span className="control control-green" />
                </div>
              </div>
              <div className="player-mock-container">
                <div className="player-mock-view">
                  <div className="player-mock-screen">
                    <div className="player-glow" aria-hidden="true" />
                    <div className="player-center-icon" onClick={togglePlay} role="button" tabIndex={0} aria-label={playing ? 'Pause' : 'Play'} onKeyDown={(e) => { if (e.key === 'Enter') togglePlay(); }}>
                      {playing ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                          <polygon points="6,3 20,12 6,21" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="playback-bar-mock" aria-hidden="true">
                    <div className="pb-btn" onClick={togglePlay} role="button" tabIndex={-1}>
                      {playing ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,3 20,12 6,21" /></svg>
                      )}
                    </div>
                    <div className="pb-track">
                      <div className="pb-track-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="pb-time">{timeStr}</span>
                    <div className="pb-btn">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="2" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem' }} onClick={cycleProvider} aria-label="Cycle to next video provider">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
                Cycle Provider
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} aria-live="polite">{currentProvider}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-features" id="features" aria-label="Features">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">Built for Scale. Designed for Simplicity.</h2>
            <p className="section-subtitle">A single, unified API across every major video platform &mdash; with zero baggage.</p>
          </div>

          <div className="bento-grid">
            {[
              {
                w: 2,
                icon: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
                title: 'Zero Runtime Dependencies',
                text: <>Ships as pure ES2022 modules with zero npm dependencies. Optional <code>hls.js</code> and <code>dashjs</code> peer deps are dynamically imported only when needed &mdash; no bundler bloat, no tree-shaking required.</>,
              },
              {
                w: 1,
                icon: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
                title: 'Shadow DOM Controls',
                text: <>A floating pill-shaped control bar rendered in <strong>Shadow DOM</strong> &mdash; fully isolated from page styles. Themed entirely via CSS custom properties for seamless integration.</>,
              },
              {
                w: 2,
                icon: <><circle cx="5" cy="6" r="3" /><circle cx="19" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><path d="M5 9v1a2 2 0 0 0 2 2h3" /><path d="M19 9v1a2 2 0 0 1-2 2h-3" /><path d="M12 12v3" /></>,
                title: 'Framework-Agnostic + React & Vue Adapters',
                text: <>Works anywhere JavaScript runs &mdash; plain JS, React 18+, Vue 3+. Tree-shakeable subpath exports per resolver mean you only ship what you use. SSR-safe with no-op on server render.</>,
              },
              {
                w: 1,
                icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
                title: 'Interaction Shield',
                text: <>An invisible overlay blocks provider-native controls on iframe embeds. All interactions are forwarded via <strong>postMessage</strong>, giving you unified programmatic control over play, pause, seek, and volume.</>,
              },
              {
                w: 2,
                icon: <path d="M12 5a3 3 0 0 0-5.6-1.5A2.5 2.5 0 0 0 4 6.5 2.5 2.5 0 0 0 4 11a2.5 2.5 0 0 0 2.5 2.5A3 3 0 0 0 12 12V5Zm0 0a3 3 0 0 1 5.6-1.5A2.5 2.5 0 0 1 20 6.5 2.5 2.5 0 0 1 20 11a2.5 2.5 0 0 1-2.5 2.5A3 3 0 0 1 12 12" />,
                title: 'Light Mode & Complete Theming',
                text: <>Thumbnail-first "light" mode with animated glow placeholder. Full CSS custom property theming &mdash; primary color, accent, font family, opacity, blur, border radius, margin, button size, slider height, time display.</>,
              },
              {
                w: 1,
                icon: <path d="M12 2c.4 2.6 1 4.6 2.2 5.8S17.4 9.6 20 10c-2.6.4-4.6 1-5.8 2.2S12.4 15.4 12 18c-.4-2.6-1-4.6-2.2-5.8S6.6 10.4 4 10c2.6-.4 4.6-1 5.8-2.2S11.6 4.6 12 2Z" />,
                title: 'TypeScript & Tree-Shakeable',
                text: <>Full TypeScript declarations auto-generated from JSDoc. Per-resolver subpath exports (<code>universal-embed-player/resolvers/youtube</code>) let bundlers tree-shake unused providers.</>,
              },
            ].map((f, i) => (
              <div key={i} className={`bento-card glass hover-glow ${f.w === 2 ? 'bento-w-2' : ''}`}>
                <div className="card-icon-wrapper">
                  <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{f.icon}</svg>
                </div>
                <h3 className="card-title">{f.title}</h3>
                <p className="card-text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-providers" id="providers" aria-label="Supported video providers">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">Supported Providers</h2>
            <p className="section-subtitle">Every major video platform &mdash; resolved, normalized, and unified under a single API.</p>
          </div>
          <div className="providers-grid">
            {providers.map((p) => (
              <div key={p.name} className="provider-card glass hover-glow">
                <div className="provider-icon" style={{ background: p.bg, color: p.color }} aria-hidden="true">{p.icon}</div>
                <div className="provider-name">{p.name}</div>
                <div className="provider-desc">{p.name === 'YouTube' ? 'Full postMessage control' : p.name === 'Vimeo' ? 'Private video support' : p.name === 'HLS' ? 'Native + hls.js fallback' : p.name === 'DASH' ? 'Dynamic dashjs import' : p.name === 'Dropbox' ? 'Direct MP4 resolution' : p.name === 'Wistia' ? 'postMessage API' : p.name === 'Cloudflare' ? 'Signed URLs' : p.name === 'FastPix' ? 'Performance-first' : p.name === 'JW Player' ? 'Cloud-hosted embed' : p.name === 'Kaltura' ? 'Dynamic config' : p.name === 'MP4/WebM' ? 'Direct video element' : 'Opt-in API fallback'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-frameworks" id="frameworks" aria-label="Framework integrations">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">Works Everywhere</h2>
            <p className="section-subtitle">Drop it into any project &mdash; no framework lock-in, no build step required.</p>
          </div>
          <div className="frameworks-grid">
            <article className="framework-card glass hover-glow">
              <span className="framework-tag">Vanilla JS</span>
              <h3>Plain JavaScript</h3>
              <p>Import directly as ES modules. No bundler, no framework, no build step. Works in any modern browser.</p>
              <div className="code-snippet">
                <pre><code>{`import { createPlayer } from 'universal-embed-player'

createPlayer('#my-player', {
  url: 'https://youtu.be/dQw4w9WgXcQ'
}`}</code></pre>
              </div>
            </article>
            <article className="framework-card glass hover-glow" style={{ borderColor: 'rgba(0,216,255,0.15)' }}>
              <span className="framework-tag" style={{ background: 'rgba(0,216,255,0.1)', color: '#00d8ff', borderColor: 'rgba(0,216,255,0.2)' }}>React</span>
              <h3>React 18+</h3>
              <p>Drop-in <code>&lt;Player&gt;</code> component with all props typed. SSR-safe with no-op on the server.</p>
              <div className="code-snippet">
                <pre><code>{`import { Player } from 'universal-embed-player/react'

function Video() {
  return <Player url="https://vimeo.com/123456789" />
}`}</code></pre>
              </div>
            </article>
            <article className="framework-card glass hover-glow" style={{ borderColor: 'rgba(66,184,131,0.15)' }}>
              <span className="framework-tag" style={{ background: 'rgba(66,184,131,0.1)', color: '#42b883', borderColor: 'rgba(66,184,131,0.2)' }}>Vue 3</span>
              <h3>Vue 3</h3>
              <p>Reactive <code>&lt;Player&gt;</code> component with full TypeScript support. Lifecycle-aware mounting.</p>
              <div className="code-snippet">
                <pre><code>{`import { Player } from 'universal-embed-player/vue'

<Player url="https://www.youtube.com/watch?v=abc123" />`}</code></pre>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
