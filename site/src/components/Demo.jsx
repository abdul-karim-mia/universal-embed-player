import { useState, useEffect, useRef, useCallback } from 'react';

const PROVIDERS = [
  { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com/watch?v=MLpWrANjFbI', stability: 'stable' },
  { id: 'vimeo', title: 'Vimeo', url: 'https://vimeo.com/22439234', stability: 'stable' },
  { id: 'wistia', title: 'Wistia', url: 'https://fast.wistia.net/embed/iframe/26sk4lmiix', stability: 'stable', note: 'Mounts a Wistia Channel API div, not a raw iframe.' },
  { id: 'cloudflare-stream', title: 'Cloudflare', url: '', placeholder: 'https://iframe.cloudflarestream.com/<uid>', stability: 'stable', note: 'Requires your own Stream account video.' },
  { id: 'fastpix', title: 'FastPix', url: 'https://play.fastpix.com/?playbackId=f6b0ae8f-0e64-4206-a973-d93851ea6f20', stability: 'stable' },
  { id: 'jwplayer', title: 'JW Player', url: 'https://content.jwplatform.com/manifests/yp34SRmf.m3u8', placeholder: 'https://cdn.jwplayer.com/players/<mediaId>-<playerId>.html', stability: 'stable', note: 'Requires your own JW Platform media.' },
  { id: 'kaltura', title: 'Kaltura', url: 'https://www.kaltura.com/index.php/extwidget/preview/partner_id/691292/uiconf_id/20499062/entry_id/0_c076mna6/embed/iframe', stability: 'stable' },
  { id: 'direct-mp4', title: 'Direct MP4', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', stability: 'stable' },
  { id: 'hls', title: 'HLS', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', stability: 'stable', note: 'Requires hls.js on non-Safari browsers.' },
  { id: 'dash', title: 'DASH', url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd', stability: 'stable', note: 'Requires dash.js.' },
  { id: 'dropbox', title: 'Dropbox', url: 'https://www.dropbox.com/scl/fi/s63p1hburnln3wcw45pil/sample-mp4-file.mp4?rlkey=g04k3hvvvz15zcyl5b9j42jc4&st=pmwequuw&dl=0', stability: 'stable' },
];

function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function Demo() {
  const [activeId, setActiveId] = useState(PROVIDERS[0].id);
  const [url, setUrl] = useState(PROVIDERS[0].url);
  const [player, setPlayer] = useState(null);
  const [resolved, setResolved] = useState(null);
  const [events, setEvents] = useState([]);
  const [ready, setReady] = useState(false);
  const [opts, setOpts] = useState({
    controls: true, shield: true, light: false, autoplay: false,
    muted: false, loop: false, centerPlayButton: false,
    posterEnabled: true, poster: '',
    glowing: true, gc1: '#0e0b16', gc2: '#1a1040', gc3: '#2a1b4e', gc4: '#3b185f', gs: '12',
    primary: '#6d5efc', accent: '#ffffff', font: '',
    barBg: '#141220', barOpacity: '0.55', barBlur: '10', barRadius: '999px', barMargin: '8px',
    btnSize: '26px', sliderH: '3px', timeSize: '11px',
    volume: '0.8', volumeKey: '', videoSize: 'contain', rates: '0.5, 1, 1.5, 2',
  });

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
      mountRef.current.replaceChildren();
    }
    setPlayer(null);
    setResolved(null);
    setReady(false);
  }, []);

  const loadPlayer = useCallback(async () => {
    const targetUrl = url;
    if (!targetUrl) return;
    destroyPlayer();

    try {
      const { createPlayer, resolveSource } = await import('universal-embed-player');
      const result = resolveSource(targetUrl);
      setResolved(result);

      if (!result) {
        addEvent('error', 'Unable to resolve source from this URL');
        return;
      }

      addEvent('resolve', `${result.type} → ${result.engine}`);

      const theme = {};
      if (opts.primary) theme.primaryColor = opts.primary;
      if (opts.accent) theme.accentColor = opts.accent;
      if (opts.font) theme.fontFamily = opts.font;
      const barBg = hexToRgba(opts.barBg, parseFloat(opts.barOpacity));
      if (barBg !== 'rgba(20, 18, 32, 0.55)') theme.barBackground = barBg;
      if (opts.barBlur !== '10') theme.barBlur = `${opts.barBlur}px`;
      if (opts.barRadius !== '999px') theme.barRadius = opts.barRadius;
      if (opts.barMargin !== '8px') theme.barMargin = opts.barMargin;
      if (opts.btnSize !== '26px') theme.buttonSize = opts.btnSize;
      if (opts.sliderH !== '3px') theme.sliderHeight = opts.sliderH;
      if (opts.timeSize !== '11px') theme.timeFontSize = opts.timeSize;

      const instance = createPlayer(mountRef.current, {
        url: targetUrl,
        controls: opts.controls,
        shield: opts.shield,
        light: opts.light,
        autoplay: opts.autoplay,
        muted: opts.muted,
        loop: opts.loop,
        centerPlayButton: opts.centerPlayButton,
        poster: opts.posterEnabled ? (opts.poster || undefined) : undefined,
        glowingPlaceholder: opts.glowing,
        glowStyle: (opts.glowing && (opts.gc1 !== '#0e0b16' || opts.gc2 !== '#1a1040' || opts.gc3 !== '#2a1b4e' || opts.gc4 !== '#3b185f' || opts.gs !== '12')) ? {
          ...(opts.gc1 !== '#0e0b16' && { color1: opts.gc1 }),
          ...(opts.gc2 !== '#1a1040' && { color2: opts.gc2 }),
          ...(opts.gc3 !== '#2a1b4e' && { color3: opts.gc3 }),
          ...(opts.gc4 !== '#3b185f' && { color4: opts.gc4 }),
          ...(opts.gs !== '12' && { speed: `${opts.gs}s` }),
        } : undefined,
        theme: Object.keys(theme).length ? theme : undefined,
        volume: parseFloat(opts.volume) || undefined,
        volumeKey: opts.volumeKey || undefined,
        videoSize: opts.videoSize || undefined,
        playbackRates: opts.rates.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)),
        onEvent: (event) => addEvent(event.type, event),
      });
      playerRef.current = instance;
      setPlayer(instance);

      await instance.ready;
      setReady(true);
      addEvent('ready', 'Player is ready');
    } catch (err) {
      addEvent('error', err.message);
    }
  }, [url, opts, addEvent, destroyPlayer]);

  useEffect(() => {
    return () => destroyPlayer();
  }, [destroyPlayer]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  const switchProvider = (id) => {
    destroyPlayer();
    setEvents([]);
    const p = PROVIDERS.find(x => x.id === id);
    setActiveId(id);
    setUrl(p?.url || '');
  };

  useEffect(() => {
    if (url && !playerRef.current) loadPlayer();
  }, [url]);

  const callApi = (method, ...args) => {
    if (playerRef.current && playerRef.current[method]) {
      const result = playerRef.current[method](...args);
      addEvent('api', `${method}(${args.map(a => typeof a === 'string' ? `'${a}'` : JSON.stringify(a)).join(', ')})`);
      return result;
    }
    addEvent('warn', `Player not ready for ${method}()`);
  };

  const updateOpt = (key, value) => {
    setOpts(prev => ({ ...prev, [key]: value }));
  };

  const generateCode = () => {
    const lines = [];
    lines.push(`createPlayer('#container', {`);
    const u = url || PROVIDERS.find(p => p.id === activeId)?.url || '';
    lines.push(`  url: '${u}',`);
    if (!opts.controls) lines.push(`  controls: false,`);
    if (opts.shield === false) lines.push(`  shield: false,`);
    if (opts.light) lines.push(`  light: true,`);
    if (opts.light && !opts.glowing) lines.push(`  glowingPlaceholder: false,`);
    if (opts.autoplay) lines.push(`  autoplay: true,`);
    if (opts.muted) lines.push(`  muted: true,`);
    if (opts.loop) lines.push(`  loop: true,`);
    if (opts.posterEnabled && opts.poster) lines.push(`  poster: '${opts.poster}',`);
    if (opts.videoSize && opts.videoSize !== 'contain') lines.push(`  videoSize: '${opts.videoSize}',`);
    if (opts.centerPlayButton) lines.push(`  centerPlayButton: true,`);
    if (opts.glowing && (opts.gc1 !== '#0e0b16' || opts.gc2 !== '#1a1040' || opts.gc3 !== '#2a1b4e' || opts.gc4 !== '#3b185f' || opts.gs !== '12')) {
      lines.push(`  glowStyle: {`);
      if (opts.gc1 !== '#0e0b16') lines.push(`    color1: '${opts.gc1}',`);
      if (opts.gc2 !== '#1a1040') lines.push(`    color2: '${opts.gc2}',`);
      if (opts.gc3 !== '#2a1b4e') lines.push(`    color3: '${opts.gc3}',`);
      if (opts.gc4 !== '#3b185f') lines.push(`    color4: '${opts.gc4}',`);
      if (opts.gs !== '12') lines.push(`    speed: '${opts.gs}s',`);
      lines.push(`  },`);
    }
    const themeEntries = [];
    if (opts.primary && opts.primary !== '#6d5efc') themeEntries.push(`    primaryColor: '${opts.primary}'`);
    if (opts.accent && opts.accent !== '#ffffff') themeEntries.push(`    accentColor: '${opts.accent}'`);
    if (opts.font) themeEntries.push(`    fontFamily: '${opts.font}'`);
    const barBg = hexToRgba(opts.barBg, parseFloat(opts.barOpacity));
    if (barBg !== 'rgba(20, 18, 32, 0.55)') themeEntries.push(`    barBackground: '${barBg}'`);
    if (opts.barBlur !== '10') themeEntries.push(`    barBlur: '${opts.barBlur}px'`);
    if (opts.barRadius !== '999px') themeEntries.push(`    barRadius: '${opts.barRadius}'`);
    if (opts.barMargin !== '8px') themeEntries.push(`    barMargin: '${opts.barMargin}'`);
    if (opts.btnSize !== '26px') themeEntries.push(`    buttonSize: '${opts.btnSize}'`);
    if (opts.sliderH !== '3px') themeEntries.push(`    sliderHeight: '${opts.sliderH}'`);
    if (opts.timeSize !== '11px') themeEntries.push(`    timeFontSize: '${opts.timeSize}'`);
    if (themeEntries.length) {
      lines.push(`  theme: {`);
      lines.push(themeEntries.join(',\n'));
      lines.push(`  },`);
    }
    const vol = parseFloat(opts.volume);
    if (!isNaN(vol) && vol !== 0.8) lines.push(`  volume: ${vol},`);
    if (opts.volumeKey) lines.push(`  volumeKey: '${opts.volumeKey}',`);
    const rates = opts.rates.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    const defaultRates = [0.5, 1, 1.5, 2];
    if (JSON.stringify(rates) !== JSON.stringify(defaultRates) && rates.length) {
      lines.push(`  playbackRates: [${rates.join(', ')}],`);
    }
    lines.push(`  onEvent: (event) => console.log(event.type, event),`);
    lines.push(`});`);
    return lines.join('\n');
  };

  const activeProvider = PROVIDERS.find(p => p.id === activeId);

  return (
    <section className="section-demo" id="demo" aria-label="Live Demo">
      <div className="container">
        <div className="section-header-center">
          <h2 className="section-title">Try It Live</h2>
          <p className="section-subtitle">Select a provider below, tweak options on the right, and see the unified player in action.</p>
        </div>

        <div className="demo-provider-tabs">
          {PROVIDERS.map((p) => (
            <button key={p.id} className={`demo-provider-tab ${activeId === p.id ? 'active' : ''}`} onClick={() => switchProvider(p.id)}>
              {p.title}
            </button>
          ))}
        </div>

        <div className="demo-body">
          <div className="demo-player-section">
            <div className="demo-player-container">
              {!player && !resolved && (
                <div className="demo-player-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                  <p>Select a provider or enter a URL</p>
                </div>
              )}
              <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            </div>

            <div className="demo-api-bar">
              <button className="demo-api-btn primary" onClick={() => callApi('play')} disabled={!player}>Play</button>
              <button className="demo-api-btn" onClick={() => callApi('pause')} disabled={!player}>Pause</button>
              <span className="demo-api-sep" />
              <label className="demo-api-label">Seek <input type="number" className="demo-api-input-num" id="api-seek" defaultValue="10" min="0" />s
                <button className="demo-api-btn small" onClick={() => { const v = parseFloat(document.getElementById('api-seek')?.value); if (!isNaN(v)) callApi('seekTo', v); }} disabled={!player}>Go</button>
              </label>
              <span className="demo-api-sep" />
              <label className="demo-api-label">Vol <input type="range" className="demo-api-range" id="api-vol" min="0" max="1" step="0.05" defaultValue="0.8" onInput={(e) => { if (player) callApi('setVolume', parseFloat(e.target.value)); }} /></label>
              <button className="demo-api-btn" onClick={() => callApi('mute')} disabled={!player}>Mute</button>
              <button className="demo-api-btn" onClick={() => callApi('unmute')} disabled={!player}>Unmute</button>
              <button className="demo-api-btn" onClick={() => callApi('toggleMute')} disabled={!player}>Toggle</button>
              <span className="demo-api-sep" />
              <label className="demo-api-label">Rate
                <select className="demo-api-select" id="api-rate" defaultValue="1" onChange={(e) => { if (player) callApi('setPlaybackRate', parseFloat(e.target.value)); }}>
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </label>
              <label className="demo-api-label">Size
                <select className="demo-api-select" id="api-size" defaultValue="contain" onChange={(e) => { if (player) callApi('setVideoSize', e.target.value); }}>
                  <option value="contain">Fit</option>
                  <option value="cover">Fill</option>
                  <option value="fill">Stretch</option>
                </select>
              </label>
              <span className="demo-api-sep" />
              <button className="demo-api-btn" onClick={destroyPlayer} disabled={!player}>Destroy</button>
            </div>

            <div className="demo-provider-meta">
              {activeProvider && (
                <span className={`demo-stability ${activeProvider.stability}`}>{activeProvider.stability}</span>
              )}
              {activeProvider?.note && <span className="demo-note">{activeProvider.note}</span>}
              {resolved && (
                <span className="demo-resolved">Resolved: <strong>{resolved.type}</strong> &middot; Engine: <strong>{resolved.engine}</strong></span>
              )}
            </div>

            <div className="glass" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Event Log</h4>
                <button className="demo-quick-btn" onClick={() => setEvents([])}>Clear</button>
              </div>
              <div className="demo-event-log" ref={logRef} style={{ maxHeight: '100px' }}>
                {events.length === 0 && <span style={{ color: 'var(--text-dark)', fontSize: '0.78rem' }}>No events yet.</span>}
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

          <div className="demo-customizer glass">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 12px' }}>Options</h3>

            <div className="customizer-field">
              <label className="customizer-label"><span>URL</span>
                <input type="text" className="customizer-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={activeProvider?.placeholder || ''} />
              </label>
            </div>

            <div className="customizer-row">
              <label className="customizer-check"><input type="checkbox" checked={opts.controls} onChange={(e) => updateOpt('controls', e.target.checked)} /> Controls</label>
              <label className="customizer-check"><input type="checkbox" checked={opts.shield} onChange={(e) => updateOpt('shield', e.target.checked)} /> Shield</label>
            </div>

            <div className="customizer-row">
              <label className="customizer-check"><input type="checkbox" checked={opts.light} onChange={(e) => updateOpt('light', e.target.checked)} /> Light</label>
              <label className="customizer-check"><input type="checkbox" checked={opts.autoplay} onChange={(e) => updateOpt('autoplay', e.target.checked)} /> Autoplay</label>
            </div>

            <div className="customizer-row">
              <label className="customizer-check"><input type="checkbox" checked={opts.muted} onChange={(e) => updateOpt('muted', e.target.checked)} /> Muted</label>
              <label className="customizer-check"><input type="checkbox" checked={opts.loop} onChange={(e) => updateOpt('loop', e.target.checked)} /> Loop</label>
            </div>

            <div className="customizer-row">
              <label className="customizer-check"><input type="checkbox" checked={opts.centerPlayButton} onChange={(e) => updateOpt('centerPlayButton', e.target.checked)} /> Center Play</label>
            </div>

            <div className="customizer-field" style={{ display: opts.light ? 'flex' : 'none' }}>
              <label className="customizer-check"><input type="checkbox" checked={opts.posterEnabled} onChange={(e) => updateOpt('posterEnabled', e.target.checked)} /> Poster</label>
              {opts.posterEnabled && <input type="text" className="customizer-input" value={opts.poster} onChange={(e) => updateOpt('poster', e.target.value)} placeholder="Poster URL (blank = auto)" style={{ flex: 1 }} />}
            </div>

            {opts.light && (
              <div className="customizer-field">
                <label className="customizer-check"><input type="checkbox" checked={opts.glowing} onChange={(e) => updateOpt('glowing', e.target.checked)} /> Glow Fallback</label>
                {opts.glowing && (
                  <div className="customizer-glow-colors">
                    {['gc1', 'gc2', 'gc3', 'gc4'].map((k, i) => (
                      <label key={k} className="customizer-swatch">
                        <span>C{i + 1}</span>
                        <input type="color" value={opts[k]} onChange={(e) => updateOpt(k, e.target.value)} />
                      </label>
                    ))}
                    <label className="customizer-speed">Speed <input type="number" value={opts.gs} onChange={(e) => updateOpt('gs', e.target.value)} min="1" max="60" />s</label>
                  </div>
                )}
              </div>
            )}

            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', margin: '16px 0 8px', color: 'var(--text-muted)' }}>Theme</h4>

            <div className="customizer-row">
              <label className="customizer-swatch"><span>Primary</span>
                <input type="color" value={opts.primary} onChange={(e) => updateOpt('primary', e.target.value)} />
              </label>
              <label className="customizer-swatch"><span>Accent</span>
                <input type="color" value={opts.accent} onChange={(e) => updateOpt('accent', e.target.value)} />
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Font</span>
                <select className="customizer-select" value={opts.font} onChange={(e) => updateOpt('font', e.target.value)}>
                  <option value="">System default</option>
                  <option value="system-ui, sans-serif">System UI</option>
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </label>
            </div>

            <div className="customizer-row">
              <label className="customizer-swatch"><span>Bar BG</span>
                <input type="color" value={opts.barBg} onChange={(e) => updateOpt('barBg', e.target.value)} />
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Bar opacity</span>
                <input type="range" min="0" max="1" step="0.05" value={opts.barOpacity} onChange={(e) => updateOpt('barOpacity', e.target.value)} style={{ flex: 1 }} />
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Blur</span>
                <input type="range" min="0" max="40" step="1" value={opts.barBlur} onChange={(e) => updateOpt('barBlur', e.target.value)} style={{ flex: 1 }} />
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Radius</span>
                <select className="customizer-select" value={opts.barRadius} onChange={(e) => updateOpt('barRadius', e.target.value)}>
                  <option value="999px">Pill (default)</option>
                  <option value="16px">Rounded</option>
                  <option value="8px">Subtle</option>
                  <option value="0">Sharp</option>
                </select>
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Margin</span>
                <select className="customizer-select" value={opts.barMargin} onChange={(e) => updateOpt('barMargin', e.target.value)}>
                  <option value="8px">Default (8px)</option>
                  <option value="4px">Tight (4px)</option>
                  <option value="0px">Flush (0px)</option>
                  <option value="12px">Loose (12px)</option>
                </select>
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Button size</span>
                <select className="customizer-select" value={opts.btnSize} onChange={(e) => updateOpt('btnSize', e.target.value)}>
                  <option value="26px">Default (26px)</option>
                  <option value="20px">Small (20px)</option>
                  <option value="32px">Large (32px)</option>
                  <option value="40px">XL (40px)</option>
                </select>
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Slider track</span>
                <select className="customizer-select" value={opts.sliderH} onChange={(e) => updateOpt('sliderH', e.target.value)}>
                  <option value="3px">Default (3px)</option>
                  <option value="2px">Thin (2px)</option>
                  <option value="5px">Thick (5px)</option>
                  <option value="8px">Bold (8px)</option>
                </select>
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Time size</span>
                <select className="customizer-select" value={opts.timeSize} onChange={(e) => updateOpt('timeSize', e.target.value)}>
                  <option value="11px">Default (11px)</option>
                  <option value="9px">Small (9px)</option>
                  <option value="13px">Medium (13px)</option>
                  <option value="15px">Large (15px)</option>
                </select>
              </label>
            </div>

            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', margin: '16px 0 8px', color: 'var(--text-muted)' }}>Playback</h4>

            <div className="customizer-field">
              <label className="customizer-label"><span>Volume</span>
                <input type="number" className="customizer-input" value={opts.volume} onChange={(e) => updateOpt('volume', e.target.value)} min="0" max="1" step="0.1" style={{ width: '70px' }} />
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Vol Key</span>
                <input type="text" className="customizer-input" value={opts.volumeKey} onChange={(e) => updateOpt('volumeKey', e.target.value)} placeholder="localStorage key" />
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Video Size</span>
                <select className="customizer-select" value={opts.videoSize} onChange={(e) => updateOpt('videoSize', e.target.value)}>
                  <option value="contain">Fit / Contain</option>
                  <option value="cover">Fill / Cover</option>
                  <option value="fill">Stretch</option>
                </select>
              </label>
            </div>

            <div className="customizer-field">
              <label className="customizer-label"><span>Rates</span>
                <input type="text" className="customizer-input" value={opts.rates} onChange={(e) => updateOpt('rates', e.target.value)} placeholder="0.5, 1, 1.5, 2" />
              </label>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', margin: '0 0 8px', color: 'var(--text-muted)' }}>Generated Code</h4>
              <pre className="demo-code-block">{generateCode()}</pre>
              <button className="demo-quick-btn" style={{ marginTop: '8px' }} onClick={() => navigator.clipboard.writeText(generateCode())}>Copy Code</button>
              <button className="demo-btn" style={{ marginLeft: '8px' }} onClick={() => loadPlayer()}>Apply & Load</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
