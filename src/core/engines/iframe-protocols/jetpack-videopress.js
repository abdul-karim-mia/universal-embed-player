// Official Automattic-maintained iframe API (github.com/Automattic/
// videopress-player-api-doc/blob/trunk/public-js-api.md) — script loads
// VideoPressIframeApi(iframe, readyCallback), returning an `api` object with
// api.controls.play()/pause()/seek(ms)/volume(0-100)/mute(bool) and
// api.status.onPlayerStatusChanged((oldStatus, newStatus) => ...) reporting
// 'ready' | 'playing' | 'paused' | 'ended' | 'stalled'.
const SCRIPT_URL = 'https://v0.wordpress.com/js/videojs/videopress-iframe-api.js';
let apiPromise = null;

function loadVideoPressApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.VideoPressIframeApi) return Promise.resolve(window.VideoPressIframeApi);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.addEventListener('load', () => resolve(window.VideoPressIframeApi), { once: true });
    script.addEventListener('error', () => reject(new Error('VideoPress iframe API failed to load')), { once: true });
    document.head.append(script);
  });

  return apiPromise;
}

export const JETPACK_VIDEOPRESS_PROTOCOL = {
  buildSrc(embedUrl) {
    return embedUrl;
  },

  /**
   * @param {HTMLIFrameElement} iframe
   * @param {import('../events.js').UnifiedEventEmitter} emitter
   * @param {import('../../types.js').PlayerOptions} options
   */
  async attach(iframe, emitter, options) {
    let VideoPressIframeApi;
    try {
      VideoPressIframeApi = await loadVideoPressApi();
    } catch {
      return null;
    }
    if (!VideoPressIframeApi) return null;

    return new Promise((resolve) => {
      const api = VideoPressIframeApi(iframe, () => {
        let wasPlaying = false;
        let lastDuration = 0;

        api.status.onPlayerStatusChanged?.((_oldStatus, newStatus) => {
          if (newStatus === 'playing') {
            wasPlaying = true;
            emitter.emit('play');
          } else if (newStatus === 'pause') {
            // Confirmed live: the real status string is "pause", not "paused"
            // as public-js-api.md's prose summary ("ready, playing, paused,
            // ended, stalled") would suggest.
            wasPlaying = false;
            emitter.emit('pause');
          } else if (newStatus === 'ended') {
            if (!options.loop) emitter.emit('ended');
          } else if (newStatus === 'stalled') {
            emitter.emit('buffering');
          }
        });

        api.status.onTimeUpdate?.((data) => {
          // Confirmed live (demo.html verification): the callback receives a
          // bare number in *seconds*, not the milliseconds the public-js-api.md
          // examples elsewhere (api.controls.seek(ms)) would suggest — dividing
          // by 1000 here previously crushed every value to ~0.
          const currentTime = typeof data === 'number' ? data : (data?.currentTime ?? data?.currentTimeMs);
          if (typeof currentTime !== 'number') return;
          api.info.duration?.().then((duration) => {
            lastDuration = duration ?? lastDuration;
            emitter.emit('timeupdate', { currentTime, duration: lastDuration });
          });
        });

        api.status.onError?.((err) => {
          emitter.emit('error', {
            code: 'VIDEOPRESS_PLAYER_ERROR',
            message: err?.message ?? 'VideoPress player error',
            provider: 'jetpack-videopress',
          });
        });

        if (options.muted) api.controls.mute(true);
        emitter.emit('ready');
        if (options.autoplay) api.controls.play();

        resolve({
          play: () => api.controls.play(),
          pause: () => api.controls.pause(),
          seekTo: (seconds) => api.controls.seek(Math.round(seconds * 1000)),
          setVolume: (volume) => api.controls.volume(Math.round(volume * 100)),
          setPlaybackRate: () => {}, // not documented in the public API — no-op, same precedent as kaltura.js
          destroy: () => {
            wasPlaying = false;
          },
        });
      });
    });
  },
};
