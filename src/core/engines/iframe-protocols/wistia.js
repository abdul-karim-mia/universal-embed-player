// Wistia Channel/Player API (E-v1.js) — the official script, lazily loaded
// at runtime. Reference: https://wistia.com/support/developers/player-api
// Not an npm dependency (rules.md §1a): a runtime <script src> injection
// pointed at Wistia's own CDN, same pattern as youtube.js/vimeo.js — nothing
// is imported from node_modules, so the dependency ceiling holds.
//
// Unlike YouTube/Vimeo, Wistia's control bridge isn't a cross-origin iframe
// postMessage protocol at all: E-v1.js must be loaded in the *parent* page,
// where it scans the DOM for `<div class="wistia_embed wistia_async_HASHEDID">`
// containers and injects the actual player into them, then hands back a
// Channel API object via a global `_wq` push-queue callback. This exact
// shape (div + class + `_wq.push({id, onReady, options})`) is cross-checked
// against the vendored `wistia-video-element` package (reference/node_modules/
// wistia-video-element/dist/wistia-video-element.js) — a battle-tested,
// real-world implementation of this same bridge — rather than guessed from
// memory, per rules.md §4.2. A raw `<iframe class="wistia_embed">` (what this
// package mounted before) does *not* reliably get picked up the same way, so
// `createElement` below overrides the default iframe engine's element choice.
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
    // wistia_async_<id> is what E-v1.js scans the DOM for to know which
    // video to inject; the unique element id below is the correlation key
    // for the _wq onReady callback (a page could embed the same video twice).
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

    // Commands can be called before Wistia's onReady callback fires (e.g. an
    // eager click right after mount) — queue them and flush once the real
    // video API object exists, same ready-gating lesson learned the hard way
    // from the old hand-rolled Vimeo protocol (see vimeo.js's header comment).
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
          // Mirrors the native <video loop> / Vimeo protocols: no 'ended'
          // while looping.
          if (!options.loop) emitter.emit('ended');
        });
        video.bind('secondchange', (seconds) => {
          emitter.emit('timeupdate', { currentTime: seconds, duration: video.duration() ?? 0 });
        });
        video.bind('volumechange', (volume) => {
          emitter.emit('volumechange', { volume, muted: volume === 0 });
        });
        video.bind('playbackratechange', (rate) => emitter.emit('ratechange', { rate }));
        // Wistia's v1 Channel API has no documented generic 'error' or
        // buffering bind event — left unemitted rather than guessed (the
        // exact mistake already made and fixed once for Vimeo).

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
        // Brand-minimization params (plan.md §7), Wistia's own documented
        // Channel API embed options (wistia.com/support/embed-and-share/
        // channel-embeds#customizing-your-embed): `chromeless` turns off
        // Wistia's own native control bar entirely and `playButton: false`
        // hides its big centered play button, so our Shadow-DOM control bar
        // and interaction shield (mounted whenever `controllable` is true)
        // are the only clickable surface — cross-checked against the
        // vendored wistia-video-element package, which sets these from the
        // same `controls` flag for the identical reason.
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
