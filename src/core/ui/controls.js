












const ICONS = {
  
  play:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',

  
  pause:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',

  
  volume:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',

  
  volumeMuted:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M21 8.8l-.8-.8-3.2 3.2-3.2-3.2-.8.8 3.2 3.2-3.2 3.2.8.8 3.2-3.2 3.2 3.2.8-.8-3.2-3.2z"/></svg>',

  
  chevron:
    '<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>',

  
  fullscreen:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',

  
  fullscreenExit:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
};


const NARROW_BREAKPOINT_PX = 320;
const IDLE_HIDE_MS = 2500;

function formatTime(seconds) {
  const clamped = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function createControls(container, engine, emitter, options) {
  const host = document.createElement('div');
  host.setAttribute('data-uep-controls', '');
  Object.assign(host.style, { position: 'absolute', left: '0', right: '0', bottom: '0' });

  const shadow = host.attachShadow({ mode: 'open' });
  const rates = options.playbackRates ?? [0.5, 1, 1.5, 2];

  shadow.innerHTML = `
    <style>
      /*
       * All --uep-* defaults live here as var() FALLBACKS, not as :host
       * declarations. This is intentional: if a default were declared in
       * :host { --uep-foo: ... } it would win over values *inherited* from
       * the container (where applyTheme writes them), because a property set
       * on an element via a CSS rule beats an inherited value from its parent.
       * Using var(--uep-foo, <default>) instead lets the inherited value from
       * the container take priority while still providing a sensible fallback
       * when no theme is supplied.
       */
      :host {
        display: block;
        opacity: 1;
        transition: opacity 0.25s ease;
      }
      :host([data-hidden]) {
        opacity: 0;
        pointer-events: none;
      }
      .bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: var(--uep-bar-margin, 8px);
        padding: var(--uep-bar-padding, 5px 10px);
        border-radius: var(--uep-bar-radius, 999px);
        background: var(--uep-bar-bg, rgba(20, 18, 32, 0.55));
        backdrop-filter: blur(var(--uep-bar-blur, 10px));
        -webkit-backdrop-filter: blur(var(--uep-bar-blur, 10px));
        font-family: var(--uep-font-family, system-ui, sans-serif);
      }
      button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: none;
        border: none;
        color: var(--uep-accent-color, #ffffff);
        cursor: pointer;
        padding: 5px;
        border-radius: 999px;
        line-height: 0;
        transition: color 0.15s ease, opacity 0.15s ease;
      }
      button[data-muted] {
        color: #ff6b6b;
        opacity: 0.9;
      }
      button[data-action='toggle'] {
        background: var(--uep-primary-color, #6d5efc);
        width: var(--uep-btn-size, 26px);
        height: var(--uep-btn-size, 26px);
      }
      input[type='range'] {
        flex: 1;
        min-width: 0;
        height: var(--uep-slider-height, 3px);
        accent-color: var(--uep-primary-color, #6d5efc);
      }
      .time {
        flex-shrink: 0;
        color: var(--uep-accent-color, #ffffff);
        font-size: var(--uep-time-size, 11px);
        font-variant-numeric: tabular-nums;
        opacity: 0.85;
      }
      .volume-group {
        position: relative;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      .volume-inline {
        width: 60px;
        margin-left: 4px;
      }

      /* ── Shared popup chrome ───────────────────────────────────────────────
       * Both the volume slider and rate picker use .popup as their base.
       * Positioning, size, and transform-origin are the only things each
       * popup adds individually below.
       * ──────────────────────────────────────────────────────────────────── */
      .popup {
        position: absolute;
        padding: 6px;
        border-radius: 14px;
        background: var(--uep-bar-bg, rgba(20, 18, 32, 0.9));
        backdrop-filter: blur(var(--uep-bar-blur, 14px));
        -webkit-backdrop-filter: blur(var(--uep-bar-blur, 14px));
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.45),
          0 0 0 1px rgba(109, 94, 252, 0.12);
        /* hidden state */
        opacity: 0;
        visibility: hidden;
        transform: scale(0.9);
        transition:
          opacity   0.18s ease,
          transform 0.18s ease,
          visibility 0s linear 0.18s;
        pointer-events: none;
      }
      .popup.open {
        opacity: 1;
        visibility: visible;
        transform: scale(1);
        transition:
          opacity   0.18s ease,
          transform 0.18s ease,
          visibility 0s linear 0s;
        pointer-events: auto;
      }

      /* ── Volume popup ────────────────────────────────────────────────────── */
      .volume-popup {
        bottom: calc(100% + 10px);
        left: 50%;
        padding: 10px 7px;
        border-radius: 999px;
        transform-origin: bottom center;
        transform: scale(0.9) translateY(4px);
      }
      .volume-popup.open {
        transform: scale(1) translateY(0);
      }
      .volume-popup input[type='range'] {
        writing-mode: vertical-lr;
        direction: rtl;
        width: 4px;
        height: 64px;
      }

      /* ── Rate group / toggle button ──────────────────────────────────────── */
      .rate-group {
        position: relative;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      button[data-action='rate-toggle'] {
        width: auto;
        gap: 4px;
        padding: 3px 8px 3px 10px;
        font-size: var(--uep-time-size, 11px);
        font-weight: 600;
        letter-spacing: 0.03em;
        opacity: 1;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      button[data-action='rate-toggle']:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.22);
      }
      button[data-action='rate-toggle'] svg {
        transition: transform 0.2s ease;
        opacity: 0.7;
      }
      button[data-action='rate-toggle'][data-open] svg {
        transform: rotate(180deg);
        opacity: 1;
      }

      /* ── Rate popup ──────────────────────────────────────────────────────── */
      .rate-popup {
        display: flex;
        flex-direction: column;
        gap: 2px;
        bottom: calc(100% + 10px);
        right: 0;
        min-width: 54px;
        transform-origin: bottom right;
        transform: scale(0.9) translateY(6px);
      }
      .rate-popup.open {
        transform: scale(1) translateY(0);
      }

      /* ── Rate option buttons ─────────────────────────────────────────────── */
      .rate-option {
        width: 100%;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: var(--uep-time-size, 11px);
        font-weight: 500;
        font-family: inherit;
        color: var(--uep-accent-color, #ffffff);
        text-align: center;
        opacity: 0.75;
        transition: background 0.12s ease, opacity 0.12s ease;
        white-space: nowrap;
      }
      .rate-option:hover {
        background: rgba(255, 255, 255, 0.1);
        opacity: 1;
      }
      .rate-option[data-active] {
        background: var(--uep-primary-color, #6d5efc);
        opacity: 1;
        font-weight: 700;
      }
      .rate-option[data-active]:hover {
        background: var(--uep-primary-color, #6d5efc);
        filter: brightness(1.1);
      }

      /* ── Narrow-mode overrides ───────────────────────────────────────────── */
      :host([data-narrow]) .volume-inline {
        display: none;
      }
      :host(:not([data-narrow])) .volume-popup {
        display: none !important;
      }
      :host([data-narrow]) .volume-popup.open {
        display: flex;
      }
    </style>
    <div class="bar" part="bar">
      <button part="play-button" data-action="toggle" aria-label="Play">${ICONS.play}</button>
      <input part="progress-bar" data-role="progress" type="range" min="0" max="0" value="0" step="0.1" />
      <span class="time" part="time" data-role="time">-0:00</span>
      <div class="volume-group">
        <button part="volume-button" data-action="volume-toggle" aria-label="Volume">${ICONS.volume}</button>
        <div class="volume-popup popup" data-role="volume-popup">
          <input part="volume-slider" class="volume-slider" data-role="volume" type="range" min="0" max="1" value="1" step="0.01" />
        </div>
        <input part="volume-slider-inline" class="volume-inline volume-slider" data-role="volume-inline" type="range" min="0" max="1" value="1" step="0.01" />
      </div>
      <div class="rate-group">
        <button part="rate-button" data-action="rate-toggle" aria-label="Playback speed">
          <span data-role="rate-label">1x</span>${ICONS.chevron}
        </button>
        <div class="rate-popup popup" data-role="rate-popup">
          ${rates
            .map(
              (rateValue) =>
                `<button type="button" part="rate-option" class="rate-option" data-rate="${rateValue}"${rateValue === 1 ? ' data-active' : ''}>${rateValue}x</button>`,
            )
            .join('')}
        </div>
      </div>
      <button part="fullscreen-button" data-action="fullscreen" aria-label="Fullscreen">${ICONS.fullscreen}</button>
    </div>
  `;

  const playButton = shadow.querySelector('[data-action="toggle"]');
  const progress = shadow.querySelector('[data-role="progress"]');
  const timeEl = shadow.querySelector('[data-role="time"]');
  const volumeButton = shadow.querySelector('[data-action="volume-toggle"]');
  const volumePopup = shadow.querySelector('[data-role="volume-popup"]');
  const volumeSliders = shadow.querySelectorAll('.volume-slider');
  const rateButton = shadow.querySelector('[data-action="rate-toggle"]');
  const ratePopup = shadow.querySelector('[data-role="rate-popup"]');
  const rateLabel = shadow.querySelector('[data-role="rate-label"]');
  const rateOptions = shadow.querySelectorAll('.rate-option');
  const fullscreenButton = shadow.querySelector('[data-action="fullscreen"]');

  let isPlaying = false;
  let isScrubbing = false;
  let isHoveringBar = false;
  let isMuted = false;
  let preMuteVolume = 1; 
  let lastDuration = 0;
  let hideTimer = null;

  
  const syncMuteIcon = (muted) => {
    isMuted = muted;
    volumeButton.innerHTML = muted ? ICONS.volumeMuted : ICONS.volume;
    volumeButton.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    volumeButton.toggleAttribute('data-muted', muted);
  };

  const hasOpenPopup = () => volumePopup.classList.contains('open') || ratePopup.classList.contains('open');

  const scheduleAutoHide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (isPlaying && !isScrubbing && !isHoveringBar && !hasOpenPopup()) {
        host.setAttribute('data-hidden', '');
      }
    }, IDLE_HIDE_MS);
  };
  const revealBar = () => {
    host.removeAttribute('data-hidden');
    scheduleAutoHide();
  };
  const onBarMouseEnter = () => {
    isHoveringBar = true;
    revealBar();
  };
  const onBarMouseLeave = () => {
    isHoveringBar = false;
    scheduleAutoHide();
  };

  const onPlayClick = () => (isPlaying ? engine.pause() : engine.play());
  const onProgressPointerDown = () => {
    isScrubbing = true;
  };
  const onProgressChange = () => {
    engine.seekTo(Number(progress.value));
    isScrubbing = false;
  };
  const onVolumeInput = (event) => {
    const value = Number(event.target.value);
    
    for (const slider of volumeSliders) slider.value = String(value);
    
    if (value > 0 && isMuted) {
      isMuted = false;
      syncMuteIcon(false);
    }
    engine.setVolume(value);
  };
  const onVolumeToggleClick = () => {
    const willMute = !isMuted;
    if (willMute) {
      
      preMuteVolume = Number(volumeSliders[0]?.value) || 1;
      
      syncMuteIcon(true);
      
      engine.setVolume(0);
    } else {
      
      syncMuteIcon(false);
      
      for (const slider of volumeSliders) slider.value = String(preMuteVolume);
      
      engine.setVolume(preMuteVolume);
    }
  };
  const onRateToggleClick = () => {
    volumePopup.classList.remove('open');
    const willOpen = !ratePopup.classList.contains('open');
    ratePopup.classList.toggle('open', willOpen);
    rateButton.toggleAttribute('data-open', willOpen);
  };
  const onRateOptionClick = (event) => {
    const value = Number(event.currentTarget.dataset.rate);
    engine.setPlaybackRate(value);
    rateLabel.textContent = `${value}x`;
    for (const option of rateOptions) {
      option.toggleAttribute('data-active', Number(option.dataset.rate) === value);
    }
    ratePopup.classList.remove('open');
    rateButton.removeAttribute('data-open');
  };
  const onOutsideClick = (event) => {
    const path = event.composedPath();
    
    if (!path.includes(rateButton) && !path.includes(ratePopup)) {
      ratePopup.classList.remove('open');
      rateButton.removeAttribute('data-open');
    }
  };
  const syncFullscreenIcon = () => {
    const isFs = !!document.fullscreenElement;
    fullscreenButton.innerHTML = isFs ? ICONS.fullscreenExit : ICONS.fullscreen;
    fullscreenButton.setAttribute('aria-label', isFs ? 'Exit fullscreen' : 'Fullscreen');
  };
  const onFullscreenClick = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen?.();
    }
  };

  playButton.addEventListener('click', onPlayClick);
  progress.addEventListener('pointerdown', onProgressPointerDown);
  progress.addEventListener('change', onProgressChange);
  for (const slider of volumeSliders) slider.addEventListener('input', onVolumeInput);
  volumeButton.addEventListener('click', onVolumeToggleClick);
  rateButton.addEventListener('click', onRateToggleClick);
  for (const option of rateOptions) option.addEventListener('click', onRateOptionClick);
  document.addEventListener('click', onOutsideClick);
  fullscreenButton.addEventListener('click', onFullscreenClick);
  document.addEventListener('fullscreenchange', syncFullscreenIcon);
  container.addEventListener('pointermove', revealBar);
  container.addEventListener('pointerdown', revealBar);
  host.addEventListener('mouseenter', onBarMouseEnter);
  host.addEventListener('mouseleave', onBarMouseLeave);

  const resizeObserver = new ResizeObserver(([entry]) => {
    host.toggleAttribute('data-narrow', entry.contentRect.width < NARROW_BREAKPOINT_PX);
  });
  resizeObserver.observe(host);

  const unsubscribers = [
    emitter.on('play', () => {
      isPlaying = true;
      playButton.innerHTML = ICONS.pause;
      playButton.setAttribute('aria-label', 'Pause');
      scheduleAutoHide();
    }),
    emitter.on('pause', () => {
      isPlaying = false;
      playButton.innerHTML = ICONS.play;
      playButton.setAttribute('aria-label', 'Play');
      clearTimeout(hideTimer);
      host.removeAttribute('data-hidden');
    }),
    emitter.on('timeupdate', ({ currentTime, duration }) => {
      if (!duration) return;
      lastDuration = duration;
      if (!isScrubbing) {
        progress.max = String(duration);
        progress.value = String(currentTime);
      }
      timeEl.textContent = `-${formatTime(duration - currentTime)}`;
    }),
    emitter.on('volumechange', ({ volume: currentVolume }) => {
      
      
      
      
      
      
      if (!isMuted) {
        for (const slider of volumeSliders) slider.value = String(currentVolume);
      }
    }),
  ];

  container.append(host);

  return {
    /** Returns true if the control bar is currently in the muted state. */
    getMuteState: () => isMuted,
    /** Sync mute icon when mute state is changed via the player API. */
    setMuted: (muted) => syncMuteIcon(muted),
    destroy: () => {
      playButton.removeEventListener('click', onPlayClick);
      progress.removeEventListener('pointerdown', onProgressPointerDown);
      progress.removeEventListener('change', onProgressChange);
      for (const slider of volumeSliders) slider.removeEventListener('input', onVolumeInput);
      volumeButton.removeEventListener('click', onVolumeToggleClick);
      rateButton.removeEventListener('click', onRateToggleClick);
      for (const option of rateOptions) option.removeEventListener('click', onRateOptionClick);
      document.removeEventListener('click', onOutsideClick);
      fullscreenButton.removeEventListener('click', onFullscreenClick);
      document.removeEventListener('fullscreenchange', syncFullscreenIcon);
      container.removeEventListener('pointermove', revealBar);
      container.removeEventListener('pointerdown', revealBar);
      host.removeEventListener('mouseenter', onBarMouseEnter);
      host.removeEventListener('mouseleave', onBarMouseLeave);
      clearTimeout(hideTimer);
      resizeObserver.disconnect();
      for (const unsubscribe of unsubscribers) unsubscribe();
      host.remove();
    },
  };
}
