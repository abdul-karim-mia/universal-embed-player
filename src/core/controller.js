



import { resolveSource } from '../resolvers/index.js';
import { UnifiedEventEmitter } from './events.js';
import { createNativeEngine } from './engines/native.js';
import { createHlsEngine } from './engines/hls.js';
import { createDashEngine } from './engines/dash.js';
import { createIframeEngine } from './engines/iframe.js';
import { createShield } from './ui/shield.js';
import { createControls } from './ui/controls.js';
import { createCenterPlayButton } from './ui/center-play.js';
import { createSpinner } from './ui/spinner.js';
import { createLightPoster } from './lazy.js';
import { applyTheme } from './ui/theme.js';
import { resolveViaIframely } from './iframely-fallback.js';
import { buildVideoObjectJsonLd, stringifyForScriptTag } from './seo.js';

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

  
  
  
  
  
  
  
  let resolved = resolveSource(options.url);

  
  
  
  
  
  
  
  let seoScript = null;
  if (options.seo) {
    const jsonLd = buildVideoObjectJsonLd(resolved, options.url, options.seo);
    if (jsonLd) {
      seoScript = document.createElement('script');
      seoScript.type = 'application/ld+json';
      seoScript.setAttribute('data-uep-seo', '');
      seoScript.textContent = stringifyForScriptTag(jsonLd);
      document.head.appendChild(seoScript);
    } else {
      console.warn('[uep] `seo` option requires at least a `name` — skipped');
    }
  }

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  let engine = null;
  let shield = null;
  let controls = null;
  let centerPlayButton = null;
  let spinner = options.loadingSpinner !== false ? createSpinner(container, emitter) : null;
  let lightPoster = null;
  let destroyed = false;
  let lastVolume = clamp(options.volume ?? 1, 0, 1);
  let muteState = false;
  let currentVideoSize = options.videoSize || 'contain';

  
  
  emitter.on('volumechange', ({ volume }) => {
    if (typeof volume === 'number' && Number.isFinite(volume) && volume > 0) {
      lastVolume = volume;
    }
  });

  async function mountEngine() {
    spinner?.show();
    try {
      if (!resolved && options.iframelyKey) {
        resolved = await resolveViaIframely(options.url, options.iframelyKey);
        if (destroyed) return;
      }

      if (!resolved) {
        emitter.emit('error', {
          code: 'UNSUPPORTED_SOURCE',
          message: `Could not resolve a player for this URL: ${options.url}`,
          provider: 'unknown',
        });
        return;
      }

      if (resolved.type === 'native') {
        engine = createNativeEngine(container, resolved, options, emitter);
      } else if (resolved.type === 'hls') {
        engine = await createHlsEngine(container, resolved, options, emitter);
      } else if (resolved.type === 'dash') {
        engine = await createDashEngine(container, resolved, options, emitter);
      } else if (resolved.type === 'iframe') {
        engine = await createIframeEngine(container, resolved, options, emitter);
      }

      if (engine?.mediaElement) {
        engine.mediaElement.style.objectFit = currentVideoSize;
      }

      
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

      if (options.centerPlayButton === true && engine?.controllable) {
        centerPlayButton = createCenterPlayButton(container, engine, emitter, options);
      }
    } catch (err) {
      emitter.emit('error', {
        code: 'ENGINE_INIT_FAILED',
        message: err?.message ?? 'Failed to initialise the player engine',
        provider: resolved?.provider ?? 'unknown',
      });
    }
  }

  const wantsLightMode = Boolean(options.light) && resolved;
  const ready = wantsLightMode
    ? new Promise((resolve) => {
        
        
        
        
        
        
        
        lightPoster = createLightPoster(container, resolved, options, () => {
          lightPoster = null;
          mountEngine().then(() => {
            engine?.play();
            resolve();
          });
        });
      })
    : mountEngine();



  
  
  
  
  
  const getCurrentMuteState = () => (controls ? controls.getMuteState() : muteState);

  const applyMute = (mute) => {
    if (mute === getCurrentMuteState()) return; 
    muteState = mute;
    
    
    controls?.setMuted(mute);
    try {
      engine?.setVolume(mute ? 0 : lastVolume);
    } catch (err) {
      
      const prev = !mute;
      muteState = prev;
      controls?.setMuted(prev);
      console.error('[uep] applyMute failed:', err);
    }
  };

  const player = {
    /** Start playback. Catches autoplay-policy rejections and re-emits as 'error'. */
    play: () => {
      try {
        const p = engine?.play();
        if (p instanceof Promise) {
          p.catch((err) =>
            emitter.emit('error', {
              code: 'PLAY_REJECTED',
              message: err?.message ?? 'play() was rejected',
              provider: resolved?.provider ?? 'unknown',
            }),
          );
        }
      } catch (err) {
        emitter.emit('error', {
          code: 'PLAY_FAILED',
          message: err?.message ?? 'play() threw an error',
          provider: resolved?.provider ?? 'unknown',
        });
      }
    },

    pause: () => {
      try {
        engine?.pause();
      } catch (err) {
        console.error('[uep] pause() failed:', err);
      }
    },

    /**
     * Seek to a position in seconds.
     * Silently clamps to [0, ∞) and ignores non-finite values.
     */
    seekTo: (seconds) => {
      if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
        console.warn(`[uep] seekTo(${seconds}): expected a finite number — ignored`);
        return;
      }
      try {
        engine?.seekTo(Math.max(0, seconds));
      } catch (err) {
        console.error('[uep] seekTo() failed:', err);
      }
    },

    /**
     * Set volume in [0, 1]. Non-finite or out-of-range values are clamped.
     * Passing volume > 0 while muted automatically unmutes.
     */
    setVolume: (volume) => {
      if (typeof volume !== 'number' || !Number.isFinite(volume)) {
        console.warn(`[uep] setVolume(${volume}): expected a finite number in [0,1] — ignored`);
        return;
      }
      const v = clamp(volume, 0, 1);
      if (v > 0) lastVolume = v; 
      if (v > 0 && muteState) {
        muteState = false;
        controls?.setMuted(false);
      }
      try {
        engine?.setVolume(v);
      } catch (err) {
        console.error('[uep] setVolume() failed:', err);
      }
    },

    /**
     * Set playback rate. Clamped to [0.0625, 16] (browser-safe range).
     * Non-positive or non-finite values are rejected.
     */
    setPlaybackRate: (rate) => {
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
        console.warn(`[uep] setPlaybackRate(${rate}): expected a positive finite number — ignored`);
        return;
      }
      try {
        engine?.setPlaybackRate(clamp(rate, 0.0625, 16));
      } catch (err) {
        console.error('[uep] setPlaybackRate() failed:', err);
      }
    },

    /**
     * Set video display size styling.
     * @param {'cover' | 'contain' | 'fill'} size
     */
    setVideoSize: (size) => {
      const valid = ['cover', 'contain', 'fill'];
      if (!valid.includes(size)) {
        console.warn(`[uep] setVideoSize("${size}"): expected 'cover', 'contain', or 'fill' — ignored`);
        return;
      }
      currentVideoSize = size;
      if (engine?.mediaElement) {
        engine.mediaElement.style.objectFit = size;
      }
    },

    /** Mute audio. Idempotent — calling when already muted is a no-op. */
    mute: () => applyMute(true),

    /** Unmute audio, restoring the pre-mute volume. Idempotent. */
    unmute: () => applyMute(false),

    /** Toggle between muted and unmuted. */
    toggleMute: () => applyMute(!getCurrentMuteState()),

    /**
     * Subscribe to a player event. Returns an unsubscribe function.
     * Unknown event types produce a console.warn and return a no-op unsubscriber
     * rather than throwing.
     */
    on: (type, handler) => {
      try {
        return emitter.on(type, handler);
      } catch (err) {
        console.warn(`[uep] on("${type}") failed:`, err);
        return () => {};
      }
    },

    off: (type, handler) => emitter.off(type, handler),

    /**
     * Tear down the player. Idempotent — safe to call multiple times.
     */
    destroy: () => {
      if (destroyed) return; 
      destroyed = true;
      controls?.destroy();
      shield?.destroy();
      centerPlayButton?.destroy();
      spinner?.destroy();
      lightPoster?.destroy();
      engine?.destroy();
      seoScript?.remove();
      emitter.removeAllListeners();
      
      controls = null;
      shield = null;
      centerPlayButton = null;
      spinner = null;
      engine = null;
      lightPoster = null;
      seoScript = null;
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
    setVideoSize: noop,
    mute: noop,
    unmute: noop,
    toggleMute: noop,
    on: noop,
    off: noop,
    destroy: noop,
    ready: Promise.resolve(),
  };
}
