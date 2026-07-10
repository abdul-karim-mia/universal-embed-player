// DASH engine. No browser plays DASH natively, so `dash.js` is always
// required for `.mpd` sources — but it's still an optional peer dependency,
// dynamically imported only when a DASH source is actually resolved (see
// rules.md §1a). A consumer who never uses DASH never downloads it.
import { applyMediaOptions, attachMediaElementEvents, createMediaControls } from './media-events.js';
import { posterUrlFor } from '../lazy.js';

export async function createDashEngine(container, resolvedSource, options, emitter) {
  const video = document.createElement('video');
  video.poster = options.poster ?? resolvedSource.poster ?? posterUrlFor(resolvedSource) ?? '';
  applyMediaOptions(video, options);
  const detachEvents = attachMediaElementEvents(video, emitter, 'dash', options);

  let dashjs;
  try {
    const mod = await import('dashjs');
    // dashjs ships only a UMD/CJS build (no ESM `exports` field), so where
    // `MediaPlayer` ends up on the imported namespace varies by loader: some
    // expose it directly, others nest it under `.default` or a named
    // `.dashjs` export (e.g. jsdelivr's `+esm` transform does the latter).
    dashjs = mod.MediaPlayer ? mod : (mod.default?.MediaPlayer ? mod.default : mod.dashjs);
    if (!dashjs?.MediaPlayer) throw new Error('dashjs module has no MediaPlayer export');
  } catch {
    emitter.emit('error', {
      code: 'DASH_JS_NOT_INSTALLED',
      message: 'DASH playback requires dashjs. Run: npm install dashjs (optional peer dependency, see plan.md §0.2).',
      provider: 'dash',
    });
    container.append(video);
    return { ...createMediaControls(video, emitter, 'dash'), destroy: () => finalize(video, detachEvents, null) };
  }

  const player = dashjs.MediaPlayer().create();
  player.on(dashjs.MediaPlayer.events.ERROR, (event) => {
    emitter.emit('error', {
      code: 'DASH_PLAYBACK_ERROR',
      message: event?.error?.message ?? 'Fatal dash.js error',
      provider: 'dash',
    });
  });
  player.initialize(video, resolvedSource.src, options.autoplay ?? false);

  container.append(video);

  // dashjs manages this <video> element internally (ABR, buffer/catch-up
  // logic) and expects control through its own player API rather than direct
  // element manipulation — seeking, rate, and volume set on `video` directly
  // can be silently overridden by dashjs on its next internal tick. play/pause
  // stay on the raw element so autoplay-rejection promise handling (below)
  // keeps working the same way every other engine reports it.
  const controls = createMediaControls(video, emitter, 'dash');

  return {
    ...controls,
    seekTo: (seconds) => player.seek(seconds),
    setVolume: (volume) => player.setVolume(clamp01(volume)),
    setPlaybackRate: (rate) => player.setPlaybackRate(rate),
    destroy: () => finalize(video, detachEvents, player),
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function finalize(video, detachEvents, player) {
  detachEvents();
  player?.destroy();
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.remove();
}
