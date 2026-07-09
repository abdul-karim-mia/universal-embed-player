// Native <video> engine — covers direct MP4/WebM/Ogg and every cloud-storage
// resolver (Google Drive, Dropbox, OneDrive, iCloud). Zero vendor chrome by
// construction (plan.md §7: this is the one path where "brand-free" is fully
// and honestly true).
import { applyMediaOptions, attachMediaElementEvents, createMediaControls } from './media-events.js';
import { posterUrlFor } from '../lazy.js';

export function createNativeEngine(container, resolvedSource, options, emitter) {
  const video = document.createElement('video');
  video.src = resolvedSource.src;
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
      video.load();
      video.remove();
    },
  };
}
