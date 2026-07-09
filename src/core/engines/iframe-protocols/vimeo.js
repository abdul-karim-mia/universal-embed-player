// Vimeo player.js postMessage protocol.
// Reference: https://github.com/vimeo/player.js (the library's own wire
// protocol — a small JSON-RPC-shaped message format over postMessage). We
// speak the protocol directly rather than loading Vimeo's player.js bundle.
// Unlike YouTube (see youtube.js), this is Vimeo's own documented, open-source
// wire format (not an improvised guess), so hand-rolling it directly — rather
// than loading their player.js bundle — is a reasonable, low-risk trade-off.
const VIMEO_ORIGIN = 'https://player.vimeo.com';
const SUBSCRIBED_EVENTS = ['play', 'pause', 'timeupdate', 'ended', 'volumechange', 'playbackratechange'];

function post(win, payload) {
  win?.postMessage(JSON.stringify(payload), VIMEO_ORIGIN);
}

function handleMessage(raw, emitter, iframe, options) {
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return;
  }

  switch (data.event) {
    case 'ready':
      emitter.emit('ready');
      break;
    case 'play':
      emitter.emit('play');
      break;
    case 'pause':
      emitter.emit('pause');
      break;
    case 'ended':
      // Same restart-on-ended approach as youtube.js, kept consistent across
      // both protocols rather than relying on Vimeo's less-certain native
      // setLoop command.
      if (options.loop) {
        post(iframe.contentWindow, { method: 'setCurrentTime', value: 0 });
        post(iframe.contentWindow, { method: 'play' });
      } else {
        emitter.emit('ended');
      }
      break;
    case 'timeupdate':
      emitter.emit('timeupdate', {
        currentTime: data.data?.seconds ?? 0,
        duration: data.data?.duration ?? 0,
      });
      break;
    case 'volumechange':
      emitter.emit('volumechange', {
        volume: data.data?.volume ?? 0,
        muted: (data.data?.volume ?? 1) === 0,
      });
      break;
    case 'playbackratechange':
      emitter.emit('ratechange', { rate: data.data?.playbackRate ?? 1 });
      break;
    default:
      break;
  }
}

export const VIMEO_PROTOCOL = {
  buildSrc(embedUrl) {
    return embedUrl;
  },

  /**
   * @param {HTMLIFrameElement} iframe
   * @param {import('../events.js').UnifiedEventEmitter} emitter
   * @param {import('../../types.js').PlayerOptions} options
   */
  async attach(iframe, emitter, options) {
    const onMessage = (event) => {
      if (event.origin !== VIMEO_ORIGIN) return;
      if (event.source !== iframe.contentWindow) return;
      handleMessage(event.data, emitter, iframe, options);
    };
    window.addEventListener('message', onMessage);

    const subscribe = () => {
      for (const eventName of SUBSCRIBED_EVENTS) {
        post(iframe.contentWindow, { method: 'addEventListener', value: eventName });
      }
    };
    iframe.addEventListener('load', subscribe, { once: true });

    return {
      play: () => post(iframe.contentWindow, { method: 'play' }),
      pause: () => post(iframe.contentWindow, { method: 'pause' }),
      seekTo: (seconds) => post(iframe.contentWindow, { method: 'setCurrentTime', value: seconds }),
      setVolume: (volume) => post(iframe.contentWindow, { method: 'setVolume', value: volume }),
      setPlaybackRate: (rate) => post(iframe.contentWindow, { method: 'setPlaybackRate', value: rate }),
      destroy: () => window.removeEventListener('message', onMessage),
    };
  },
};
