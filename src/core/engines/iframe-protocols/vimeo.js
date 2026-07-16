




















let apiPromise = null;

function loadVimeoApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.addEventListener('load', () => resolve(window.Vimeo), { once: true });
    script.addEventListener('error', () => reject(new Error('Vimeo Player SDK failed to load')), { once: true });
    document.head.append(script);
  });

  return apiPromise;
}

export const VIMEO_PROTOCOL = {
  buildSrc(embedUrl) {
    return embedUrl;
  },

  /**
   * @param {HTMLIFrameElement} iframe
   * @param {import('../events.js').UnifiedEventEmitter} emitter
   * @param {import('../../types.js').PlayerOptions} options
   */
  async attach(iframe, emitter, options) {
    let Vimeo;
    try {
      Vimeo = await loadVimeoApi();
    } catch {
      Vimeo = null;
    }
    if (!Vimeo) return null;

    const player = new Vimeo.Player(iframe);

    player.on('play', () => emitter.emit('play'));
    player.on('pause', () => emitter.emit('pause'));
    player.on('ended', () => {
      
      
      
      if (!options.loop) emitter.emit('ended');
    });
    player.on('timeupdate', (data) => {
      emitter.emit('timeupdate', { currentTime: data.seconds, duration: data.duration });
    });
    player.on('volumechange', (data) => {
      emitter.emit('volumechange', { volume: data.volume, muted: data.volume === 0 });
    });
    player.on('playbackratechange', (data) => emitter.emit('ratechange', { rate: data.playbackRate }));
    player.on('bufferstart', () => emitter.emit('buffering'));
    
    
    
    player.on('error', (data) => {
      emitter.emit('error', {
        code: `VIMEO_${data?.name ?? 'UNKNOWN'}`,
        message: data?.message ?? 'Vimeo player error — see https://developer.vimeo.com/player/sdk/reference#error',
        provider: 'vimeo',
      });
    });

    player.ready().then(() => emitter.emit('ready')).catch(() => {});

    
    
    
    
    
    
    
    if (options.loop) player.setLoop(true).catch(() => {});
    if (options.muted) player.setMuted(true).catch(() => {});
    if (options.autoplay) player.play().catch(() => {});

    return {
      play: () => player.play().catch(() => {}),
      pause: () => player.pause().catch(() => {}),
      seekTo: (seconds) => player.setCurrentTime(seconds).catch(() => {}),
      setVolume: (volume) => player.setVolume(volume).catch(() => {}),
      setPlaybackRate: (rate) => player.setPlaybackRate(rate).catch(() => {}),
      destroy: () => player.destroy().catch(() => {}),
    };
  },
};
