// HLS engine. Safari (and other browsers with native HLS support) plays the
// manifest directly through the <video> element — zero dependency, zero
// extra bytes downloaded. Everywhere else, `hls.js` is imported dynamically
// (never a static top-level import — see rules.md §1a) so a consumer who
// never touches an .m3u8 source never pays for it.
import { applyMediaOptions, attachMediaElementEvents, createMediaControls } from './media-events.js';
import { posterUrlFor } from '../lazy.js';

export async function createHlsEngine(container, resolvedSource, options, emitter) {
  const video = document.createElement('video');
  video.poster = options.poster ?? resolvedSource.poster ?? posterUrlFor(resolvedSource) ?? '';
  applyMediaOptions(video, options);
  const detachEvents = attachMediaElementEvents(video, emitter, 'hls', options);

  let hlsInstance = null;
  let HlsCtor = null;
  try {
    const mod = await import('hls.js');
    HlsCtor = mod.default;
  } catch {
    // hls.js optional peer dependency not installed or failed to load
  }

  const isSafari = typeof navigator !== 'undefined' && 
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const canPlayNatively = video.canPlayType('application/vnd.apple.mpegurl') !== '';

  // We only play natively on Safari where HLS is supported natively by the OS,
  // or as a fallback if hls.js cannot be loaded.
  const preferNative = canPlayNatively && (isSafari || !HlsCtor || !HlsCtor.isSupported());

  if (preferNative) {
    video.src = resolvedSource.src;
  } else {
    if (!HlsCtor) {
      emitHlsDependencyError(emitter);
      container.append(video);
      return { ...createMediaControls(video, emitter, 'hls'), destroy: () => finalize(video, detachEvents, null) };
    }

    if (!HlsCtor.isSupported()) {
      emitter.emit('error', {
        code: 'HLS_UNSUPPORTED',
        message: 'Neither native HLS nor Media Source Extensions are available in this browser.',
        provider: 'hls',
      });
      container.append(video);
      return { ...createMediaControls(video, emitter, 'hls'), destroy: () => finalize(video, detachEvents, null) };
    }

    hlsInstance = new HlsCtor();
    hlsInstance.on(HlsCtor.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      emitter.emit('error', {
        code: `HLS_${data.type}`,
        message: data.details ?? 'Fatal hls.js error',
        provider: 'hls',
      });
    });
    hlsInstance.loadSource(resolvedSource.src);
    hlsInstance.attachMedia(video);
  }

  container.append(video);

  return {
    ...createMediaControls(video, emitter, 'hls'),
    destroy: () => finalize(video, detachEvents, hlsInstance),
  };
}

function emitHlsDependencyError(emitter) {
  emitter.emit('error', {
    code: 'HLS_JS_NOT_INSTALLED',
    message:
      'This browser has no native HLS support and hls.js is not installed. Run: npm install hls.js (optional peer dependency, see plan.md §0.2).',
    provider: 'hls',
  });
}

function finalize(video, detachEvents, hlsInstance) {
  detachEvents();
  hlsInstance?.destroy();
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.remove();
}
