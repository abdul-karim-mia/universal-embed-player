// Vimeo Player SDK — the official script, lazily loaded at runtime.
// Reference: https://developer.vimeo.com/player/sdk/reference
// Not an npm dependency (rules.md §1a): a runtime <script src> injection
// pointed at Vimeo's own CDN, same pattern as youtube.js's IFrame API load —
// nothing is imported from node_modules, so the dependency ceiling holds.
//
// An earlier version of this file hand-rolled Vimeo's postMessage wire
// protocol directly instead of loading their ~25KB player.js bundle,
// reasoning that since it's Vimeo's own documented, open-source format,
// hand-rolling was a low-risk trade-off. In practice it silently dropped
// commands: the real SDK (vendored at reference/node_modules/@vimeo/player
// for inspection) gates every method call — play, pause, setCurrentTime,
// etc. — behind an internal ready-state queue and replays it once the
// iframe's own player script has actually finished initializing. Our
// hand-rolled version posted commands unconditionally, so clicking the
// custom play button before that initialization finished (a completely
// normal race on first mount, not an edge case) silently did nothing —
// this was the "controls not working" bug. It's the identical class of
// problem already hit and fixed for YouTube (see youtube.js: hand-rolling
// there didn't reliably deliver state feedback) by loading the real API
// instead of re-implementing its wire protocol. Doing the same here now.
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
      // Native <video loop> never fires 'ended' while looping (HTML5 spec) —
      // match that for consistency across engines rather than trust that
      // Vimeo's own loop timing agrees.
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
    // 'bufferend' has no distinct counterpart in the unified event enum
    // (core/types.js) — a subsequent play/pause/timeupdate message is what
    // signals playback resumed, same as the YouTube protocol.
    player.on('error', (data) => {
      emitter.emit('error', {
        code: `VIMEO_${data?.name ?? 'UNKNOWN'}`,
        message: data?.message ?? 'Vimeo player error — see https://developer.vimeo.com/player/sdk/reference#error',
        provider: 'vimeo',
      });
    });

    player.ready().then(() => emitter.emit('ready')).catch(() => {});

    // Native setLoop instead of the old hand-rolled version's manual
    // restart-on-ended hack — now that we're talking to the real SDK,
    // Vimeo's own documented method is the more reliable choice (cross-
    // checked against Plyr's vimeo plugin, which does the same). Every
    // .catch(() => {}) below guards a real, documented rejection case
    // (e.g. setPlaybackRate rejects on non-Pro accounts — see Plyr's plugin)
    // rather than a hypothetical one.
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
