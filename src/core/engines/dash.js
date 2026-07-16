



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
