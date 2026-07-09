// YouTube IFrame Player API.
// Reference: https://developers.google.com/youtube/iframe_api_reference
//
// An earlier version of this file hand-rolled the raw postMessage wire
// protocol to avoid loading YouTube's ~15KB iframe_api script. That command
// direction (parent → iframe) worked, but state feedback (iframe → parent —
// onStateChange/infoDelivery) did not reliably arrive without the official
// API bridging it, so the custom control bar's play icon and progress bar
// never updated even though clicking play actually started the video. Cross-
// checked against Mux's youtube-video-element (the implementation react-player
// v3 delegates to, see plan.md §0.1): it always loads the real API for
// exactly this reason. We do the same now — still lazy (only loaded when a
// YouTube source actually mounts), but via the real, supported bridge.
let apiPromise = null;

function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.append(script);
  });

  return apiPromise;
}

const STATE_MAP = { 0: 'ended', 1: 'play', 2: 'pause', 3: 'buffering' };
const PROGRESS_INTERVAL_MS = 250;

export const YOUTUBE_PROTOCOL = {
  buildSrc(embedUrl, origin) {
    const url = new URL(embedUrl);
    url.searchParams.set('enablejsapi', '1');
    if (origin) url.searchParams.set('origin', origin);
    return url.toString();
  },

  /**
   * @param {HTMLIFrameElement} iframe
   * @param {import('../events.js').UnifiedEventEmitter} emitter
   * @param {import('../../types.js').PlayerOptions} options
   */
  async attach(iframe, emitter, options) {
    const YT = await loadYouTubeApi();
    if (!YT) return null;

    let progressTimer = null;

    return new Promise((resolve) => {
      const player = new YT.Player(iframe, {
        events: {
          onReady: () => {
            emitter.emit('ready');
            // PlayerOptions.autoplay/.muted (core/types.js) — previously only
            // honored by the native <video> engine (engines/media-events.js).
            // Mute before play since YouTube (like most browsers) only
            // reliably allows autoplay without a user gesture when muted.
            if (options.muted) player.mute();
            if (options.autoplay) player.playVideo();
            progressTimer = setInterval(() => {
              const duration = player.getDuration();
              if (duration) {
                emitter.emit('timeupdate', { currentTime: player.getCurrentTime(), duration });
              }
            }, PROGRESS_INTERVAL_MS);

            resolve({
              play: () => player.playVideo(),
              pause: () => player.pauseVideo(),
              seekTo: (seconds) => player.seekTo(seconds, true),
              setVolume: (volume) => {
                player.setVolume(Math.round(volume * 100));
                emitter.emit('volumechange', { volume, muted: player.isMuted() });
              },
              setPlaybackRate: (rate) => player.setPlaybackRate(rate),
              destroy: () => {
                clearInterval(progressTimer);
                player.destroy();
              },
            });
          },
          onStateChange: (event) => {
            // YouTube has no native single-video loop param — restart on
            // 'ended' instead, same approach as Plyr's youtube plugin.
            if (event.data === 0 && options.loop) {
              player.seekTo(0, true);
              player.playVideo();
              return;
            }
            const type = STATE_MAP[event.data];
            if (type) emitter.emit(type);
          },
          onPlaybackRateChange: (event) => emitter.emit('ratechange', { rate: event.data }),
          onError: (event) => {
            emitter.emit('error', {
              code: `YOUTUBE_${event.data}`,
              message: `YouTube player error #${event.data} — see https://developers.google.com/youtube/iframe_api_reference#onError`,
              provider: 'youtube',
            });
          },
        },
      });
    });
  },
};
