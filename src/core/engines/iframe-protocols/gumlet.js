// Gumlet documents and ships its own Player.js-compatible wrapper
// (docs.gumlet.com/docs/playerjs) served from jsdelivr rather than a
// gumlet.io-hosted copy — that's Gumlet's own documented integration path,
// not a third-party substitution we're introducing.
const SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@gumlet/player.js@3.0/dist/main.global.js';
let apiPromise = null;

function loadGumletApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.playerjs?.Player) return Promise.resolve(window.playerjs);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.addEventListener('load', () => resolve(window.playerjs), { once: true });
    script.addEventListener('error', () => reject(new Error('Gumlet player.js failed to load')), { once: true });
    document.head.append(script);
  });

  return apiPromise;
}

// docs.gumlet.com/docs/embed-stream: disable_player_controls=true hides
// every native control bar element (progress/mute/volume/fullscreen/etc), so
// our own control bar is the only interactive chrome for those.
//
// Known limitation (rules.md §8 honesty note): a large native center play
// button stays visible whenever the video is paused regardless of this flag
// — confirmed live, and confirmed it is NOT one of the individually
// disable-able controls either (also tried appending
// disabled_player_control=play/rewind/fast-forward/pip/current-time/
// duration/mute/volume/cast/captions/airplay/fullscreen/settings for every
// documented value; the circle persisted through all of them). It appears
// to be a pause-state overlay outside the "controls" system these params
// govern, not a bug in how the flag is applied. Our shield still intercepts
// clicks and our own control bar still works correctly underneath it.
export const GUMLET_PROTOCOL = {
  buildSrc(embedUrl) {
    const url = new URL(embedUrl);
    url.searchParams.set('disable_player_controls', 'true');
    return url.toString();
  },

  /**
   * @param {HTMLIFrameElement} iframe
   * @param {import('../events.js').UnifiedEventEmitter} emitter
   * @param {import('../../types.js').PlayerOptions} options
   */
  async attach(iframe, emitter, options) {
    let playerjs;
    try {
      playerjs = await loadGumletApi();
    } catch {
      return null;
    }
    if (!playerjs) return null;

    const player = new playerjs.Player(iframe);
    let lastDuration = 0;

    return new Promise((resolve) => {
      player.on('ready', () => {
        player.on('play', () => emitter.emit('play'));
        player.on('pause', () => emitter.emit('pause'));
        player.on('ended', () => {
          if (!options.loop) emitter.emit('ended');
        });
        player.on('timeupdate', (data) => {
          lastDuration = data?.duration ?? lastDuration;
          emitter.emit('timeupdate', { currentTime: data?.seconds, duration: lastDuration });
        });
        player.on('error', (data) => {
          emitter.emit('error', {
            code: 'GUMLET_PLAYER_ERROR',
            message: data?.message ?? 'Gumlet player error',
            provider: 'gumlet',
          });
        });

        if (options.muted) player.mute();
        if (typeof player.setLoop === 'function' && options.loop) player.setLoop(true);
        emitter.emit('ready');
        if (options.autoplay) player.play();

        resolve({
          play: () => player.play(),
          pause: () => player.pause(),
          seekTo: (seconds) => player.setCurrentTime(seconds),
          setVolume: (volume) => player.setVolume(Math.round(volume * 100)),
          setPlaybackRate: (rate) => player.setPlaybackRate?.(rate),
          destroy: () => player.off?.(),
        });
      });
    });
  },
};
