// Unified control bar rendered inside a Shadow DOM root so host-page CSS can
// never leak in or out (rules.md §6). Customization points are the
// documented ::part() names below, not the internal class names, which may
// change between minor versions.
//
// Default accent is violet, not any provider's brand color (YouTube red,
// Vimeo blue, Twitch purple) — deliberately its own identity rather than
// reading as a reskin of whichever source happens to be playing. Icons are
// inline SVG (crisp at any size, no font/glyph-rendering dependency). The
// bar is a thin, floating rounded pill rather than a flush-to-edge gradient
// strip. Below a width threshold the horizontal volume slider is replaced
// by a volume button that opens a small vertical-slider popup, since a
// full-width horizontal slider doesn't fit a narrow/thumbnail-sized player.
const ICONS = {
  play: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  volume:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>',
  fullscreen:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm16 0v6h-6v-2h4v-4h2z"/></svg>',
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
      :host {
        --uep-primary-color: #6d5efc;
        --uep-accent-color: #ffffff;
        --uep-font-family: system-ui, sans-serif;
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
        margin: 8px;
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(20, 18, 32, 0.55);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        font-family: var(--uep-font-family);
      }
      button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: none;
        border: none;
        color: var(--uep-accent-color);
        cursor: pointer;
        padding: 5px;
        border-radius: 999px;
        line-height: 0;
      }
      button[data-action='toggle'] {
        background: var(--uep-primary-color);
        width: 26px;
        height: 26px;
      }
      input[type='range'] {
        flex: 1;
        min-width: 0;
        height: 3px;
        accent-color: var(--uep-primary-color);
      }
      .time {
        flex-shrink: 0;
        color: var(--uep-accent-color);
        font-size: 11px;
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
      .volume-popup {
        display: none;
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 8px;
        padding: 10px 7px;
        border-radius: 999px;
        background: rgba(20, 18, 32, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .volume-popup input[type='range'] {
        writing-mode: vertical-lr;
        direction: rtl;
        width: 4px;
        height: 64px;
      }
      .rate-group {
        position: relative;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      button[data-action='rate-toggle'] {
        width: auto;
        gap: 3px;
        padding: 4px 8px;
        font-size: 11px;
        opacity: 0.85;
      }
      .rate-popup {
        display: none;
        position: absolute;
        bottom: 100%;
        right: 0;
        margin-bottom: 8px;
        padding: 4px;
        border-radius: 10px;
        min-width: 46px;
        background: rgba(20, 18, 32, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .rate-popup.open {
        display: flex;
        flex-direction: column;
      }
      .rate-option {
        width: 100%;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        font-family: inherit;
        opacity: 1;
      }
      .rate-option[data-active] {
        background: var(--uep-primary-color);
      }
      :host([data-narrow]) .volume-inline {
        display: none;
      }
      :host(:not([data-narrow])) .volume-popup {
        display: none !important;
      }
      :host([data-narrow]) .volume-popup.open {
        display: block;
      }
    </style>
    <div class="bar" part="bar">
      <button part="play-button" data-action="toggle" aria-label="Play">${ICONS.play}</button>
      <input part="progress-bar" data-role="progress" type="range" min="0" max="0" value="0" step="0.1" />
      <span class="time" part="time" data-role="time">-0:00</span>
      <div class="volume-group">
        <button part="volume-button" data-action="volume-toggle" aria-label="Volume">${ICONS.volume}</button>
        <div class="volume-popup" data-role="volume-popup">
          <input part="volume-slider" class="volume-slider" data-role="volume" type="range" min="0" max="1" value="1" step="0.01" />
        </div>
        <input part="volume-slider-inline" class="volume-inline volume-slider" data-role="volume-inline" type="range" min="0" max="1" value="1" step="0.01" />
      </div>
      <div class="rate-group">
        <button part="rate-button" data-action="rate-toggle" aria-label="Playback speed">
          <span data-role="rate-label">1x</span>${ICONS.chevron}
        </button>
        <div class="rate-popup" data-role="rate-popup">
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
  let lastDuration = 0;
  let hideTimer = null;

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
    engine.setVolume(value);
  };
  const onVolumeToggleClick = () => {
    ratePopup.classList.remove('open');
    volumePopup.classList.toggle('open');
  };
  const onRateToggleClick = () => {
    volumePopup.classList.remove('open');
    ratePopup.classList.toggle('open');
  };
  const onRateOptionClick = (event) => {
    const value = Number(event.currentTarget.dataset.rate);
    engine.setPlaybackRate(value);
    rateLabel.textContent = `${value}x`;
    for (const option of rateOptions) {
      option.toggleAttribute('data-active', Number(option.dataset.rate) === value);
    }
    ratePopup.classList.remove('open');
  };
  const onOutsideClick = (event) => {
    const path = event.composedPath();
    if (!path.includes(volumeButton) && !path.includes(volumePopup)) {
      volumePopup.classList.remove('open');
    }
    if (!path.includes(rateButton) && !path.includes(ratePopup)) {
      ratePopup.classList.remove('open');
    }
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
      for (const slider of volumeSliders) slider.value = String(currentVolume);
    }),
  ];

  container.append(host);

  return {
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
