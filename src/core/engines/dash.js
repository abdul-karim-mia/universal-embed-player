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

  let dashModule;
  try {
    dashModule = await import('dash.js');
  } catch {
    emitter.emit('error', {
      code: 'DASH_JS_NOT_INSTALLED',
      message: 'DASH playback requires dash.js. Run: npm install dash.js (optional peer dependency, see plan.md §0.2).',
      provider: 'dash',
    });
    container.append(video);
    return { ...createMediaControls(video), destroy: () => finalize(video, detachEvents, null) };
  }

  const player = dashModule.MediaPlayer().create();
  player.on(dashModule.MediaPlayer.events.ERROR, (event) => {
    emitter.emit('error', {
      code: 'DASH_PLAYBACK_ERROR',
      message: event?.error?.message ?? 'Fatal dash.js error',
      provider: 'dash',
    });
  });
  player.initialize(video, resolvedSource.src, options.autoplay ?? false);

  container.append(video);

  return {
    ...createMediaControls(video),
    destroy: () => finalize(video, detachEvents, player),
  };
}

function finalize(video, detachEvents, player) {
  detachEvents();
  player?.destroy();
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.remove();
}
