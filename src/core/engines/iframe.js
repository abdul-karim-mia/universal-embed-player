// Iframe engine for cross-origin providers (YouTube, Vimeo, Dailymotion,
// Wistia, Cloudflare Stream). Cannot reach into the iframe's own DOM to
// strip vendor chrome — that's blocked by same-origin policy, full stop
// (plan.md §7). Where a real control bridge exists (YouTube's IFrame Player
// API, Vimeo's Player SDK, Wistia's Channel API) this engine drives real
// play/pause/seek/volume commands via `protocol.attach()` and marks itself
// `controllable`; the interaction shield (core/ui/shield.js) and custom
// control bar are only mounted by the controller when `controllable` is
// true (rules.md §4.5) — providers without a protocol adapter keep their
// native controls visible so the user always has a way to operate playback.
import { YOUTUBE_PROTOCOL } from './iframe-protocols/youtube.js';
import { VIMEO_PROTOCOL } from './iframe-protocols/vimeo.js';
import { WISTIA_PROTOCOL } from './iframe-protocols/wistia.js';

const PROTOCOLS = {
  youtube: YOUTUBE_PROTOCOL,
  vimeo: VIMEO_PROTOCOL,
  wistia: WISTIA_PROTOCOL,
};

// Minimum sandbox set that still allows each provider's own scripts/fullscreen
// to function (plan.md §11). No allow-top-navigation, no allow-popups.
const SANDBOX = 'allow-scripts allow-same-origin allow-presentation allow-popups-to-escape-sandbox';

function createDefaultIframe(resolvedSource, options, protocol) {
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

  return iframe;
}

export async function createIframeEngine(container, resolvedSource, options, emitter) {
  const protocol = PROTOCOLS[resolvedSource.provider] ?? null;

  // Wistia's real control bridge (see iframe-protocols/wistia.js) mounts a
  // <div class="wistia_embed"> that its own script injects content into, not
  // a plain cross-origin <iframe> — createElement lets a protocol override
  // the default iframe when its provider's embed shape genuinely differs.
  const element = protocol?.createElement
    ? protocol.createElement(resolvedSource, options)
    : createDefaultIframe(resolvedSource, options, protocol);

  container.append(element);

  if (!protocol) {
    element.addEventListener('load', () => emitter.emit('ready'), { once: true });
    return {
      mediaElement: element,
      controllable: false,
      play: () => {},
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      setPlaybackRate: () => {},
      destroy: () => element.remove(),
    };
  }

  const commands = await protocol.attach(element, emitter, options);

  if (!commands) {
    // API script failed to load (offline, blocked, CSP) — element still
    // shows the provider's own native controls since we never claim
    // `controllable`.
    return {
      mediaElement: element,
      controllable: false,
      play: () => {},
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      setPlaybackRate: () => {},
      destroy: () => element.remove(),
    };
  }

  return {
    mediaElement: element,
    controllable: true,
    play: commands.play,
    pause: commands.pause,
    seekTo: commands.seekTo,
    setVolume: commands.setVolume,
    setPlaybackRate: commands.setPlaybackRate,
    destroy: () => {
      commands.destroy();
      element.remove();
    },
  };
}
