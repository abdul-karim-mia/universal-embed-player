// Central controller: resolves the URL, decides which engine mounts, and
// composes the shield/controls/theme layers around it. This is the only
// module allowed to create/mount/destroy DOM nodes for the player surface
// (rules.md §3) — engines only provide the raw media surface.
import { resolveSource } from '../resolvers/index.js';
import { UnifiedEventEmitter } from './events.js';
import { createNativeEngine } from './engines/native.js';
import { createHlsEngine } from './engines/hls.js';
import { createDashEngine } from './engines/dash.js';
import { createIframeEngine } from './engines/iframe.js';
import { createShield } from './ui/shield.js';
import { createControls } from './ui/controls.js';
import { createLightPoster } from './lazy.js';
import { applyTheme } from './ui/theme.js';

const EVENT_TYPES = [
  'ready',
  'play',
  'pause',
  'buffering',
  'timeupdate',
  'volumechange',
  'ratechange',
  'ended',
  'error',
];

/**
 * @param {string | HTMLElement} target
 * @param {import('./types.js').PlayerOptions} options
 * @returns {import('./types.js').UepPlayer}
 */
export function createPlayer(target, options) {
  if (typeof window === 'undefined') {
    // SSR guard (plan.md §9): no-op until a real client mount call happens.
    return createNoopPlayer();
  }

  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) {
    throw new Error(`universal-embed-player: mount target not found: ${target}`);
  }

  const emitter = new UnifiedEventEmitter();
  container.innerHTML = '';
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  applyTheme(container, options.theme);

  if (options.onEvent) {
    for (const type of EVENT_TYPES) emitter.on(type, options.onEvent);
  }

  const resolved = resolveSource(options.url);
  if (!resolved) {
    emitter.emit('error', {
      code: 'UNSUPPORTED_SOURCE',
      message: `Could not resolve a player for this URL: ${options.url}`,
      provider: 'unknown',
    });
  }

  let engine = null;
  let shield = null;
  let controls = null;
  let lightPoster = null;
  let destroyed = false;

  async function mountEngine() {
    if (!resolved) return;

    if (resolved.type === 'native') {
      engine = createNativeEngine(container, resolved, options, emitter);
    } else if (resolved.type === 'hls') {
      engine = await createHlsEngine(container, resolved, options, emitter);
    } else if (resolved.type === 'dash') {
      engine = await createDashEngine(container, resolved, options, emitter);
    } else if (resolved.type === 'iframe') {
      engine = createIframeEngine(container, resolved, options, emitter);
    }

    // The async hls/dash import may resolve after destroy() was already called.
    if (destroyed) {
      engine?.destroy();
      engine = null;
      return;
    }

    if (options.shield !== false && engine?.controllable) {
      shield = createShield(container, engine);
      emitter.on('play', () => shield.setPlaying(true));
      emitter.on('pause', () => shield.setPlaying(false));
    }

    if (options.controls !== false && engine?.controllable) {
      controls = createControls(container, engine, emitter, options);
    }
  }

  const wantsLightMode = Boolean(options.light) && resolved;
  const ready = wantsLightMode
    ? new Promise((resolve) => {
        lightPoster = createLightPoster(container, resolved, options, () => {
          lightPoster = null;
          mountEngine().then(resolve);
        });
      })
    : mountEngine();

  /** @type {import('./types.js').UepPlayer} */
  const player = {
    play: () => engine?.play(),
    pause: () => engine?.pause(),
    seekTo: (seconds) => engine?.seekTo(seconds),
    setVolume: (volume) => engine?.setVolume(volume),
    setPlaybackRate: (rate) => engine?.setPlaybackRate(rate),
    on: (type, handler) => emitter.on(type, handler),
    off: (type, handler) => emitter.off(type, handler),
    destroy: () => {
      destroyed = true;
      controls?.destroy();
      shield?.destroy();
      lightPoster?.destroy();
      engine?.destroy();
      emitter.removeAllListeners();
    },
    ready,
  };
  return player;
}

/** @returns {import('./types.js').UepPlayer} */
function createNoopPlayer() {
  const noop = () => {};
  return {
    play: noop,
    pause: noop,
    seekTo: noop,
    setVolume: noop,
    setPlaybackRate: noop,
    on: noop,
    off: noop,
    destroy: noop,
    ready: Promise.resolve(),
  };
}
