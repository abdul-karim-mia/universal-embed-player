// Iframe engine for cross-origin providers (YouTube, Vimeo, Dailymotion,
// Wistia, Cloudflare Stream). Cannot reach into the iframe's own DOM to
// strip vendor chrome — that's blocked by same-origin policy, full stop
// (plan.md §7). Where a real control bridge exists (YouTube's IFrame Player
// API, Vimeo's player.js postMessage protocol) this engine drives real
// play/pause/seek/volume commands via `protocol.attach()` and marks itself
// `controllable`; the interaction shield (core/ui/shield.js) and custom
// control bar are only mounted by the controller when `controllable` is
// true (rules.md §4.5) — providers without a protocol adapter keep their
// native controls visible so the user always has a way to operate playback.
import { YOUTUBE_PROTOCOL } from './iframe-protocols/youtube.js';
import { VIMEO_PROTOCOL } from './iframe-protocols/vimeo.js';

const PROTOCOLS = {
  youtube: YOUTUBE_PROTOCOL,
  vimeo: VIMEO_PROTOCOL,
};

// Minimum sandbox set that still allows each provider's own scripts/fullscreen
// to function (plan.md §11). No allow-top-navigation, no allow-popups.
const SANDBOX = 'allow-scripts allow-same-origin allow-presentation allow-popups-to-escape-sandbox';

export async function createIframeEngine(container, resolvedSource, options, emitter) {
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

  container.append(iframe);

  if (!protocol) {
    iframe.addEventListener('load', () => emitter.emit('ready'), { once: true });
    return {
      mediaElement: iframe,
      controllable: false,
      play: () => {},
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      setPlaybackRate: () => {},
      destroy: () => iframe.remove(),
    };
  }

  const commands = await protocol.attach(iframe, emitter);

  if (!commands) {
    // API script failed to load (offline, blocked, CSP) — iframe still shows
    // the provider's own native controls since we never claim `controllable`.
    return {
      mediaElement: iframe,
      controllable: false,
      play: () => {},
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      setPlaybackRate: () => {},
      destroy: () => iframe.remove(),
    };
  }

  return {
    mediaElement: iframe,
    controllable: true,
    play: commands.play,
    pause: commands.pause,
    seekTo: commands.seekTo,
    setVolume: commands.setVolume,
    setPlaybackRate: commands.setPlaybackRate,
    destroy: () => {
      commands.destroy();
      iframe.remove();
    },
  };
}
