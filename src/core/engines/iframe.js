// Iframe engine for cross-origin providers (YouTube, Vimeo, Dailymotion,
// Wistia, Cloudflare Stream). Cannot reach into the iframe's own DOM to
// strip vendor chrome — that's blocked by same-origin policy, full stop
// (plan.md §7). Where a documented postMessage protocol exists (YouTube,
// Vimeo) this engine drives real play/pause/seek/volume commands and marks
// itself `controllable`; the interaction shield (core/ui/shield.js) is only
// mounted by the controller when `controllable` is true (rules.md §4.5) —
// providers without a protocol adapter keep their native controls visible so
// the user always has a way to operate playback.
import { YOUTUBE_PROTOCOL } from './iframe-protocols/youtube.js';
import { VIMEO_PROTOCOL } from './iframe-protocols/vimeo.js';

const PROTOCOLS = {
  youtube: YOUTUBE_PROTOCOL,
  vimeo: VIMEO_PROTOCOL,
};

// Minimum sandbox set that still allows each provider's own scripts/fullscreen
// to function (plan.md §11). No allow-top-navigation, no allow-popups.
const SANDBOX = 'allow-scripts allow-same-origin allow-presentation allow-popups-to-escape-sandbox';

export function createIframeEngine(container, resolvedSource, options, emitter) {
  const protocol = PROTOCOLS[resolvedSource.provider] ?? null;

  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = '0';
  iframe.style.display = 'block';
  iframe.setAttribute(
    'allow',
    'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen',
  );
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.sandbox = SANDBOX;
  iframe.title = options.title ?? `${resolvedSource.provider} video player`;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  iframe.src = protocol ? protocol.buildSrc(resolvedSource.embedUrl, origin) : resolvedSource.embedUrl;

  let onMessage = null;

  if (protocol) {
    onMessage = (event) => {
      if (!protocol.originMatches(event.origin)) return;
      if (event.source !== iframe.contentWindow) return;
      protocol.handleMessage(event.data, emitter);
    };
    window.addEventListener('message', onMessage);
    iframe.addEventListener('load', () => protocol.onReady(iframe.contentWindow), { once: true });
  } else {
    iframe.addEventListener('load', () => emitter.emit('ready'), { once: true });
  }

  container.append(iframe);

  const send = (fn) => {
    if (protocol) fn(iframe.contentWindow);
  };

  return {
    mediaElement: iframe,
    controllable: Boolean(protocol),
    play: () => send((win) => protocol.play(win)),
    pause: () => send((win) => protocol.pause(win)),
    seekTo: (seconds) => send((win) => protocol.seekTo(win, seconds)),
    setVolume: (volume) => send((win) => protocol.setVolume(win, volume)),
    setPlaybackRate: (rate) => send((win) => protocol.setPlaybackRate(win, rate)),
    destroy: () => {
      if (onMessage) window.removeEventListener('message', onMessage);
      iframe.remove();
    },
  };
}
