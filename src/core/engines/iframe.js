










import { YOUTUBE_PROTOCOL } from './iframe-protocols/youtube.js';
import { VIMEO_PROTOCOL } from './iframe-protocols/vimeo.js';
import { WISTIA_PROTOCOL } from './iframe-protocols/wistia.js';
import { KALTURA_PROTOCOL } from './iframe-protocols/kaltura.js';
import { GUMLET_PROTOCOL } from './iframe-protocols/gumlet.js';
import { JETPACK_VIDEOPRESS_PROTOCOL } from './iframe-protocols/jetpack-videopress.js';

const PROTOCOLS = {
  youtube: YOUTUBE_PROTOCOL,
  vimeo: VIMEO_PROTOCOL,
  wistia: WISTIA_PROTOCOL,
  kaltura: KALTURA_PROTOCOL,
  gumlet: GUMLET_PROTOCOL,
  'jetpack-videopress': JETPACK_VIDEOPRESS_PROTOCOL,
};



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

  
  
  
  
  
  const commands = await protocol.attach(element, emitter, options, resolvedSource);

  if (!commands) {
    
    
    
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
