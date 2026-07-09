// Unified control bar rendered inside a Shadow DOM root so host-page CSS can
// never leak in or out (rules.md §6). Customization points are the
// documented ::part() names below, not the internal class names, which may
// change between minor versions.
export function createControls(container, engine, emitter, options) {
  const host = document.createElement('div');
  host.setAttribute('data-uep-controls', '');
  Object.assign(host.style, { position: 'absolute', left: '0', right: '0', bottom: '0' });

  const shadow = host.attachShadow({ mode: 'open' });
  const rates = options.playbackRates ?? [0.5, 1, 1.5, 2];

  shadow.innerHTML = `
    <style>
      :host {
        --uep-primary-color: #ff0000;
        --uep-accent-color: #ffffff;
        --uep-font-family: system-ui, sans-serif;
      }
      .bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        font-family: var(--uep-font-family);
      }
      button {
        background: none;
        border: none;
        color: var(--uep-accent-color);
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        padding: 4px;
      }
      input[type='range'] {
        flex: 1;
        accent-color: var(--uep-primary-color);
      }
      select {
        background: rgba(0, 0, 0, 0.4);
        color: var(--uep-accent-color);
        border: none;
        border-radius: 4px;
        font-family: inherit;
      }
    </style>
    <div class="bar" part="bar">
      <button part="play-button" data-action="toggle" aria-label="Play">&#9654;</button>
      <input part="progress-bar" data-role="progress" type="range" min="0" max="0" value="0" step="0.1" />
      <input part="volume-slider" data-role="volume" type="range" min="0" max="1" value="1" step="0.01" />
      <select part="rate-select" data-role="rate">
        ${rates.map((rate) => `<option value="${rate}"${rate === 1 ? ' selected' : ''}>${rate}x</option>`).join('')}
      </select>
      <button part="fullscreen-button" data-action="fullscreen" aria-label="Fullscreen">&#9974;</button>
    </div>
  `;

  const playButton = shadow.querySelector('[data-action="toggle"]');
  const progress = shadow.querySelector('[data-role="progress"]');
  const volume = shadow.querySelector('[data-role="volume"]');
  const rate = shadow.querySelector('[data-role="rate"]');
  const fullscreenButton = shadow.querySelector('[data-action="fullscreen"]');

  let isPlaying = false;
  let isScrubbing = false;

  const onPlayClick = () => (isPlaying ? engine.pause() : engine.play());
  const onProgressPointerDown = () => {
    isScrubbing = true;
  };
  const onProgressChange = () => {
    engine.seekTo(Number(progress.value));
    isScrubbing = false;
  };
  const onVolumeInput = () => engine.setVolume(Number(volume.value));
  const onRateChange = () => engine.setPlaybackRate(Number(rate.value));
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
  volume.addEventListener('input', onVolumeInput);
  rate.addEventListener('change', onRateChange);
  fullscreenButton.addEventListener('click', onFullscreenClick);

  const unsubscribers = [
    emitter.on('play', () => {
      isPlaying = true;
      playButton.innerHTML = '&#10074;&#10074;';
      playButton.setAttribute('aria-label', 'Pause');
    }),
    emitter.on('pause', () => {
      isPlaying = false;
      playButton.innerHTML = '&#9654;';
      playButton.setAttribute('aria-label', 'Play');
    }),
    emitter.on('timeupdate', ({ currentTime, duration }) => {
      if (isScrubbing || !duration) return;
      progress.max = String(duration);
      progress.value = String(currentTime);
    }),
    emitter.on('volumechange', ({ volume: currentVolume }) => {
      volume.value = String(currentVolume);
    }),
  ];

  container.append(host);

  return {
    destroy: () => {
      playButton.removeEventListener('click', onPlayClick);
      progress.removeEventListener('pointerdown', onProgressPointerDown);
      progress.removeEventListener('change', onProgressChange);
      volume.removeEventListener('input', onVolumeInput);
      rate.removeEventListener('change', onRateChange);
      fullscreenButton.removeEventListener('click', onFullscreenClick);
      for (const unsubscribe of unsubscribers) unsubscribe();
      host.remove();
    },
  };
}
