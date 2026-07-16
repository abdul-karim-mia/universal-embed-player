


import { applyMediaOptions, attachMediaElementEvents, createMediaControls } from './media-events.js';
import { posterUrlFor } from '../lazy.js';

export function createNativeEngine(container, resolvedSource, options, emitter) {
  const video = document.createElement('video');
  
  
  
  
  video.referrerPolicy = 'no-referrer';
  if (resolvedSource.mimeType) {
    
    
    
    
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
