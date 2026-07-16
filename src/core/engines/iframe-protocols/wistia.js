

















let apiPromise = null;
let instanceCounter = 0;

function loadWistiaApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Wistia) return Promise.resolve(window.Wistia);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://fast.wistia.com/assets/external/E-v1.js';
    script.async = true;
    script.addEventListener('load', () => resolve(window.Wistia), { once: true });
    script.addEventListener('error', () => reject(new Error('Wistia Player API failed to load')), { once: true });
    document.head.append(script);
  });

  return apiPromise;
}

export const WISTIA_PROTOCOL = {
  createElement(resolvedSource) {
    const div = document.createElement('div');
    
    
    
    instanceCounter += 1;
    div.id = `uep-wistia-${resolvedSource.id}-${instanceCounter}`;
    div.className = `wistia_embed wistia_async_${resolvedSource.id}`;
    div.style.width = '100%';
    div.style.height = '100%';
    return div;
  },

  /**
   * @param {HTMLDivElement} container
   * @param {import('../events.js').UnifiedEventEmitter} emitter
   * @param {import('../../types.js').PlayerOptions} options
   */
  async attach(container, emitter, options) {
    try {
      await loadWistiaApi();
    } catch {
      return null;
    }
    if (typeof window === 'undefined' || !window.Wistia) return null;

    
    
    
    
    let video = null;
    let queue = [];
    const runOrQueue = (fn) => {
      if (video) fn(video);
      else queue.push(fn);
    };

    window._wq = window._wq || [];
    window._wq.push({
      id: container.id,
      onReady: (readyVideo) => {
        video = readyVideo;

        video.bind('play', () => emitter.emit('play'));
        video.bind('pause', () => emitter.emit('pause'));
        video.bind('end', () => {
          
          
          if (!options.loop) emitter.emit('ended');
        });
        video.bind('secondchange', (seconds) => {
          emitter.emit('timeupdate', { currentTime: seconds, duration: video.duration() ?? 0 });
        });
        video.bind('volumechange', (volume) => {
          emitter.emit('volumechange', { volume, muted: volume === 0 });
        });
        video.bind('playbackratechange', (rate) => emitter.emit('ratechange', { rate }));
        
        
        

        emitter.emit('ready');

        const pending = queue;
        queue = [];
        for (const fn of pending) fn(video);
      },
      options: {
        autoPlay: Boolean(options.autoplay),
        silentAutoPlay: options.autoplay ? 'allow' : undefined,
        muted: Boolean(options.muted),
        endVideoBehavior: options.loop ? 'loop' : undefined,
        playsinline: true,
        
        
        
        
        
        
        
        
        
        chromeless: true,
        playButton: false,
      },
    });

    return {
      play: () => runOrQueue((v) => v.play()),
      pause: () => runOrQueue((v) => v.pause()),
      seekTo: (seconds) => runOrQueue((v) => v.time(seconds)),
      setVolume: (volume) => runOrQueue((v) => v.volume(volume)),
      setPlaybackRate: (rate) => runOrQueue((v) => v.playbackRate(rate)),
      destroy: () => {
        if (!video) return;
        video.unbind('play');
        video.unbind('pause');
        video.unbind('end');
        video.unbind('secondchange');
        video.unbind('volumechange');
        video.unbind('playbackratechange');
      },
    };
  },
};
