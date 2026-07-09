// YouTube IFrame postMessage protocol.
// Reference: https://developers.google.com/youtube/iframe_api_reference
// We speak the postMessage wire protocol directly instead of loading the
// full iframe_api script — keeps this path script-injection-free until a
// consumer actually needs it (plan.md §9 performance strategy).
const YT_ORIGIN = 'https://www.youtube-nocookie.com';
const STATE_MAP = { 0: 'ended', 1: 'play', 2: 'pause', 3: 'buffering' };

function post(win, payload) {
  win?.postMessage(JSON.stringify(payload), YT_ORIGIN);
}

export const YOUTUBE_PROTOCOL = {
  buildSrc(embedUrl, origin) {
    const url = new URL(embedUrl);
    url.searchParams.set('enablejsapi', '1');
    if (origin) url.searchParams.set('origin', origin);
    return url.toString();
  },

  originMatches(origin) {
    return origin === 'https://www.youtube-nocookie.com' || origin === 'https://www.youtube.com';
  },

  onReady(win) {
    post(win, { event: 'listening', id: 'uep' });
  },

  handleMessage(raw, emitter) {
    let data;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }

    if (data.event === 'onReady') {
      emitter.emit('ready');
    } else if (data.event === 'onStateChange') {
      const type = STATE_MAP[data.info];
      if (type) emitter.emit(type);
    } else if (data.event === 'infoDelivery' && data.info && typeof data.info.currentTime === 'number') {
      emitter.emit('timeupdate', { currentTime: data.info.currentTime, duration: data.info.duration || 0 });
    }
  },

  play: (win) => post(win, { event: 'command', func: 'playVideo', args: [] }),
  pause: (win) => post(win, { event: 'command', func: 'pauseVideo', args: [] }),
  seekTo: (win, seconds) => post(win, { event: 'command', func: 'seekTo', args: [seconds, true] }),
  setVolume: (win, volume) => post(win, { event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }),
  setPlaybackRate: (win, rate) => post(win, { event: 'command', func: 'setPlaybackRate', args: [rate] }),
};
