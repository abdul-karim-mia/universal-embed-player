// Native <video> engine — covers direct MP4/WebM/Ogg and the Dropbox
// cloud-storage resolver. Zero vendor chrome by construction (plan.md §7:
// this is the one path where "brand-free" is fully and honestly true).
import { applyMediaOptions, attachMediaElementEvents, createMediaControls } from './media-events.js';
import { posterUrlFor } from '../lazy.js';

export function createNativeEngine(container, resolvedSource, options, emitter) {
  const video = document.createElement('video');
  // Set before `src` so the very first request already carries it. Dropbox
  // hotlink-checks the Referer header on some responses; stripping it makes
  // our request match a plain address-bar navigation, which it already
  // serves without issue.
  video.referrerPolicy = 'no-referrer';
  if (resolvedSource.mimeType) {
    // Some hosts (e.g. Dropbox's raw=1 download links) mislabel the response
    // Content-Type, which an unadorned `video.src` trusts and can then reject
    // as MEDIA_ERR_SRC_NOT_SUPPORTED despite the bytes being fine. A
    // <source type> overrides that with the real type instead.
    const source = document.createElement('source');
    source.src = resolvedSource.src;
    source.type = resolvedSource.mimeType;
    video.append(source);
  } else {
    video.src = resolvedSource.src;
  }
  video.poster = options.poster ?? resolvedSource.poster ?? posterUrlFor(resolvedSource) ?? '';
  applyMediaOptions(video, options);

  const detachEvents = attachMediaElementEvents(video, emitter, resolvedSource.provider, options);

  container.append(video);

  return {
    ...createMediaControls(video, emitter, resolvedSource.provider),
    destroy: () => {
      detachEvents();
      video.pause();
      video.removeAttribute('src');
      video.replaceChildren();
      video.load();
      video.remove();
    },
  };
}
