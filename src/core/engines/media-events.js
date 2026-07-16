


const VOLUME_STORAGE_PREFIX = 'uep:volume:';

export function applyMediaOptions(video, options) {
  video.playsInline = true;
  video.controls = false;
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.display = 'block';

  if (options.autoplay) video.autoplay = true;
  if (options.muted) video.muted = true;
  if (options.loop) video.loop = true;

  if (typeof options.volume === 'number') {
    video.volume = clamp01(options.volume);
  } else if (options.volumeKey && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(VOLUME_STORAGE_PREFIX + options.volumeKey);
    if (stored !== null) video.volume = clamp01(Number(stored));
  }
}

/** @returns {() => void} cleanup function that removes all bound listeners */
export function attachMediaElementEvents(video, emitter, provider, options) {
  const listeners = [
    ['loadedmetadata', () => emitter.emit('ready')],
    ['play', () => emitter.emit('play')],
    ['pause', () => emitter.emit('pause')],
    ['waiting', () => emitter.emit('buffering')],
    [
      'timeupdate',
      () => emitter.emit('timeupdate', { currentTime: video.currentTime, duration: video.duration || 0 }),
    ],
    [
      'volumechange',
      () => {
        if (options.volumeKey && typeof localStorage !== 'undefined') {
          localStorage.setItem(VOLUME_STORAGE_PREFIX + options.volumeKey, String(video.volume));
        }
        emitter.emit('volumechange', { volume: video.volume, muted: video.muted });
      },
    ],
    ['ratechange', () => emitter.emit('ratechange', { rate: video.playbackRate })],
    ['ended', () => emitter.emit('ended')],
    [
      'error',
      () =>
        emitter.emit('error', {
          code: 'NATIVE_PLAYBACK_ERROR',
          message: video.error?.message ?? 'Unknown native playback error',
          provider,
        }),
    ],
  ];

  for (const [type, handler] of listeners) {
    video.addEventListener(type, handler);
  }

  return () => {
    for (const [type, handler] of listeners) {
      video.removeEventListener(type, handler);
    }
  };
}

export function createMediaControls(video, emitter, provider) {
  return {
    mediaElement: video,
    controllable: true,
    play: () => {
      const p = video.play();
      if (p instanceof Promise) {
        p.catch((err) => {
          
          
          emitter?.emit('error', {
            code: 'PLAY_REJECTED',
            message: err?.message ?? 'play() was rejected',
            provider: provider ?? 'native',
          });
        });
      }
    },
    pause: () => video.pause(),
    seekTo: (seconds) => {
      video.currentTime = seconds;
    },
    setVolume: (volume) => {
      video.volume = clamp01(volume);
    },
    setPlaybackRate: (rate) => {
      video.playbackRate = rate;
    },
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
