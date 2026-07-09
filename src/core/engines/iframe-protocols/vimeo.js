// Vimeo player.js postMessage protocol.
// Reference: https://github.com/vimeo/player.js (the library's own wire
// protocol — a small JSON-RPC-shaped message format over postMessage). We
// speak the protocol directly rather than loading Vimeo's player.js bundle.
const VIMEO_ORIGIN = 'https://player.vimeo.com';
const SUBSCRIBED_EVENTS = ['play', 'pause', 'timeupdate', 'ended', 'volumechange', 'playbackratechange'];

function post(win, payload) {
  win?.postMessage(JSON.stringify(payload), VIMEO_ORIGIN);
}

export const VIMEO_PROTOCOL = {
  buildSrc(embedUrl) {
    return embedUrl;
  },

  originMatches(origin) {
    return origin === VIMEO_ORIGIN;
  },

  onReady(win) {
    for (const eventName of SUBSCRIBED_EVENTS) {
      post(win, { method: 'addEventListener', value: eventName });
    }
  },

  handleMessage(raw, emitter) {
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
        emitter.emit('ended');
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
  },

  play: (win) => post(win, { method: 'play' }),
  pause: (win) => post(win, { method: 'pause' }),
  seekTo: (win, seconds) => post(win, { method: 'setCurrentTime', value: seconds }),
  setVolume: (win, volume) => post(win, { method: 'setVolume', value: volume }),
  setPlaybackRate: (win, rate) => post(win, { method: 'setPlaybackRate', value: rate }),
};
