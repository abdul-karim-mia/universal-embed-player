import { useState, useEffect, useRef, useCallback } from 'react';

const providerDefaults = [
  { label: 'YouTube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'Vimeo', url: 'https://vimeo.com/76979871' },
  { label: 'HLS', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { label: 'DASH', url: 'https://dash.akamaized.net/dash264/TestCases/1c/1/ageofempires_256x144_2s.mpd' },
  { label: 'Dropbox', url: 'https://www.dropbox.com/scl/fi/example/video.mp4?rlkey=abc&dl=0' },
  { label: 'MP4', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
];

export function Demo() {
  const [url, setUrl] = useState(providerDefaults[0].url);
  const [activeProvider, setActiveProvider] = useState(0);
  const [player, setPlayer] = useState(null);
  const [resolved, setResolved] = useState(null);
  const [events, setEvents] = useState([]);
  const [apiState, setApiState] = useState({ playing: false, muted: false, volume: 1 });
  const [activeTab, setActiveTab] = useState('player');
  const [theme, setTheme] = useState({
    primary: '#8185f4',
    accent: '#22d3ee',
    font: 'Inter, sans-serif',
    barOpacity: '0.85',
    barBlur: '16',
    radius: '24',
    margin: '16',
  });
  const [codeOutput, setCodeOutput] = useState('');

  const mountRef = useRef(null);
  const logRef = useRef(null);
  const playerRef = useRef(null);

  const addEvent = useCallback((type, data) => {
    const entry = { time: new Date().toLocaleTimeString(), type, data: typeof data === 'object' ? JSON.stringify(data) : String(data) };
    setEvents((prev) => [...prev.slice(-49), entry]);
  }, []);

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
    }
    setPlayer(null);
    setResolved(null);
  }, []);

  const loadPlayer = useCallback(async (customUrl) => {
    const targetUrl = customUrl || url;
    if (!targetUrl) return;

    destroyPlayer();

    try {
      const { createPlayer, resolveSource } = await import('@uep/index.js');
      const result = resolveSource(targetUrl);
      setResolved(result);

      if (!result) {
        addEvent('error', 'Unable to resolve source from this URL');
        if (mountRef.current) {
          mountRef.current.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;gap:12px;color:var(--text-dark);text-align:center;padding:24px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style="opacity:0.4">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style="font-size:0.9rem;">Could not resolve this URL</p>
            <p style="font-size:0.78rem;">Try a different provider or check the URL format</p>
          </div>`;
        }
        return;
      }

      addEvent('resolve', `${result.type} → ${result.engine}`);

      const opts = {
        url: targetUrl,
        controls: true,
        shield: true,
        autoplay: false,
        muted: false,
        loop: false,
        light: false,
        centerPlay: true,
        theme: {
          primary: theme.primary,
          accent: theme.accent,
          fontFamily: theme.font,
          barBackground: `rgba(6, 9, 21, ${theme.barOpacity})`,
          barBackdropFilter: `blur(${theme.barBlur}px)`,
          barBorderRadius: `${theme.radius}px`,
          barMargin: `${theme.margin}px`,
        },
        onEvent: (type, data) => addEvent(type, data),
      };

      const instance = createPlayer(mountRef.current, opts);
      playerRef.current = instance;
      setPlayer(instance);

      await instance.ready;
      addEvent('ready', 'Player is ready');

      generateCode(targetUrl);
    } catch (err) {
      addEvent('error', err.message);
      if (mountRef.current) {
        mountRef.current.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;gap:12px;color:var(--text-dark);text-align:center;padding:24px;">
          <p style="font-size:0.9rem;">Failed to load player</p>
          <p style="font-size:0.78rem;font-family:var(--font-mono)">${err.message}</p>
        </div>`;
      }
    }
  }, [url, theme, addEvent, destroyPlayer]);

  useEffect(() => {
    return () => destroyPlayer();
  }, [destroyPlayer]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  const handleProviderClick = (idx) => {
    setActiveProvider(idx);
    setUrl(providerDefaults[idx].url);
    setTimeout(() => loadPlayer(providerDefaults[idx].url), 50);
  };

  const callApi = (method, ...args) => {
    if (playerRef.current && playerRef.current[method]) {
      const result = playerRef.current[method](...args);
      addEvent('api', `${method}(${args.map(a => typeof a === 'string' ? `'${a}'` : JSON.stringify(a)).join(', ')})`);
      if (method === 'play') setApiState(s => ({ ...s, playing: true }));
      if (method === 'pause') setApiState(s => ({ ...s, playing: false }));
      if (method === 'mute') setApiState(s => ({ ...s, muted: true }));
      if (method === 'unmute') setApiState(s => ({ ...s, muted: false }));
      if (method === 'toggleMute') setApiState(s => ({ ...s, muted: !s.muted }));
      if (method === 'setVolume') setApiState(s => ({ ...s, volume: args[0] }));
      return result;
    }
    addEvent('warn', `Player not ready for ${method}()`);
  };

  const generateCode = (u) => {
    const code = `import { createPlayer } from 'universal-embed-player'

createPlayer('#container', {
  url: '${u}',
  controls: true,
  shield: true,
  theme: {
    primary: '${theme.primary}',
    accent: '${theme.accent}',
    fontFamily: '${theme.font}',
    barBackground: 'rgba(6, 9, 21, ${theme.barOpacity})',
    barBackdropFilter: 'blur(${theme.barBlur}px)',
    barBorderRadius: '${theme.radius}px',
    barMargin: '${theme.margin}px',
  },
})`;
    setCodeOutput(code);
  };

  return (
    <section className="section-demo" id="demo">
      <div className="container">
        <div className="section-header-center">
          <h2 className="section-title">Try It Live</h2>
          <p className="section-subtitle">Paste any supported video URL and see the unified player in action. The player below uses the actual library.</p>
        </div>

        <div className="demo-layout">
          <div className="demo-panel glass">
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Player Controls</h3>

            <div className="demo-tabs">
              {['player', 'api', 'theme', 'code'].map((tab) => (
                <button key={tab} className={`demo-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab === 'player' ? 'Player' : tab === 'api' ? 'API' : tab === 'theme' ? 'Theme' : 'Code'}
                </button>
              ))}
            </div>

            {activeTab === 'player' && (
              <>
                <div className="demo-input-row">
                  <input type="text" className="demo-url-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a video URL..." />
                  <button className="demo-btn" onClick={() => loadPlayer()}>Load</button>
                </div>

                <div className="demo-provider-list">
                  {providerDefaults.map((p, i) => (
                    <span key={p.label} className={`demo-provider-chip ${i === activeProvider ? 'active' : ''}`} onClick={() => handleProviderClick(i)}>
                      {p.label}
                    </span>
                  ))}
                </div>

                {resolved && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Resolved: <strong style={{ color: 'var(--primary)' }}>{resolved.type}</strong></span>
                    <span style={{ color: 'var(--text-dark)' }}>&middot;</span>
                    <span>Engine: <strong style={{ color: 'var(--accent)' }}>{resolved.engine}</strong></span>
                  </div>
                )}
              </>
            )}

            {activeTab === 'api' && (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Control the player programmatically:</p>
                <div className="demo-api-controls">
                  <button className="demo-api-btn" onClick={() => callApi('play')} disabled={!player}>play()</button>
                  <button className="demo-api-btn" onClick={() => callApi('pause')} disabled={!player}>pause()</button>
                  <button className="demo-api-btn" onClick={() => callApi('toggleMute')} disabled={!player}>toggleMute()</button>
                  <button className="demo-api-btn" onClick={() => callApi('mute')} disabled={!player}>mute()</button>
                  <button className="demo-api-btn" onClick={() => callApi('unmute')} disabled={!player}>unmute()</button>
                  <button className="demo-api-btn" onClick={() => callApi('setVolume', 0.5)} disabled={!player}>vol 50%</button>
                  <button className="demo-api-btn" onClick={() => callApi('setVolume', 1)} disabled={!player}>vol 100%</button>
                  <button className="demo-api-btn" onClick={destroyPlayer} disabled={!player}>destroy()</button>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span>Playing: <strong>{apiState.playing ? 'yes' : 'no'}</strong></span>
                  <span>Muted: <strong>{apiState.muted ? 'yes' : 'no'}</strong></span>
                  <span>Volume: <strong>{Math.round(apiState.volume * 100)}%</strong></span>
                </div>
              </>
            )}

            {activeTab === 'theme' && (
              <div className="demo-theme-controls">
                {[
                  { key: 'primary', label: 'Primary Color' },
                  { key: 'accent', label: 'Accent Color' },
                  { key: 'font', label: 'Font Family' },
                  { key: 'barOpacity', label: 'Bar Opacity' },
                  { key: 'barBlur', label: 'Blur (px)' },
                  { key: 'radius', label: 'Border Radius (px)' },
                  { key: 'margin', label: 'Margin (px)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="demo-theme-label">{label}</div>
                    <input
                      className="demo-theme-input"
                      value={theme[key]}
                      onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <button className="demo-btn" style={{ width: '100%' }} onClick={() => loadPlayer()}>Apply Theme</button>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="demo-code-output">{codeOutput || '// Load a player to generate code'}</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="demo-player-container" ref={mountRef}>
              <div className="demo-player-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
                <p>Enter a URL and click "Load"</p>
                <p style={{ fontSize: '0.78rem' }}>or select a provider above</p>
              </div>
            </div>

            <div className="glass" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>Event Log</h4>
                <button className="demo-quick-btn" onClick={() => setEvents([])}>Clear</button>
              </div>
              <div className="demo-event-log" ref={logRef}>
                {events.length === 0 && <span style={{ color: 'var(--text-dark)', fontSize: '0.78rem' }}>No events yet. Load a player to see events.</span>}
                {events.map((e, i) => (
                  <div key={i} className="demo-event-entry">
                    <span className="event-time">{e.time}</span>
                    <span className="event-type">{e.type}</span>
                    <span className="event-data">{e.data}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
