let apiPromises = {};
let instanceCounter = 0;

function parseKalturaUrl(url) {
  const parsed = new URL(url);
  const segments = parsed.pathname.split('/').filter(Boolean);
  const partnerId = segments[segments.indexOf('partner_id') + 1];
  const uiconfId = segments[segments.indexOf('uiconf_id') + 1];
  const entryId = segments[segments.indexOf('entry_id') + 1];
  return { partnerId, uiconfId, entryId };
}

function loadKalturaApi(partnerId, uiconfId) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.kWidget) return Promise.resolve(window.kWidget);

  const scriptUrl = `https://cdnapisec.kaltura.com/p/${partnerId}/sp/${partnerId}00/embedIframeJs/uiconf_id/${uiconfId}/partner_id/${partnerId}`;
  if (apiPromises[scriptUrl]) return apiPromises[scriptUrl];

  apiPromises[scriptUrl] = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.addEventListener('load', () => resolve(window.kWidget), { once: true });
    script.addEventListener('error', () => reject(new Error('Kaltura Player API failed to load')), { once: true });
    document.head.append(script);
  });

  return apiPromises[scriptUrl];
}

export const KALTURA_PROTOCOL = {
  createElement(resolvedSource) {
    const div = document.createElement('div');
    instanceCounter += 1;
    div.id = `uep-kaltura-${resolvedSource.id}-${instanceCounter}`;
    div.style.width = '100%';
    div.style.height = '100%';
    return div;
  },

  async attach(container, emitter, options, resolvedSource) {
    const { partnerId, uiconfId, entryId } = parseKalturaUrl(resolvedSource.embedUrl);

    try {
      await loadKalturaApi(partnerId, uiconfId);
    } catch {
      return null;
    }
    if (typeof window === 'undefined' || !window.kWidget) return null;

    let kdp = null;
    let queue = [];
    const runOrQueue = (fn) => {
      if (kdp) fn(kdp);
      else queue.push(fn);
    };

    return new Promise((resolve) => {
      window.kWidget.embed({
        targetId: container.id,
        wid: `_${partnerId}`,
        uiconf_id: uiconfId,
        entry_id: entryId,
        flashvars: {
          autoPlay: options.autoplay ?? false,
          muted: options.muted ?? false,
          loop: options.loop ?? false,
          'controlBarContainer.plugin': false,
          'controlBarContainer.visible': false,
          'controlsHolder.includeInLayout': false,
          'controlsHolder.visible': false,
          'largePlayBtn.plugin': false,
          'largePlayBtn.visible': false,
          'playButton.plugin': false,
          'playButton.visible': false,
          'titleLabel.plugin': false,
          'titleLabel.visible': false,
          'topBarContainer.plugin': false,
          'topBarContainer.visible': false,
          'shareBtn.plugin': false,
          'shareBtn.visible': false,
          'infoBtn.plugin': false,
          'infoBtn.visible': false,
        },
        readyCallback: (playerId) => {
          kdp = document.getElementById(playerId);

          kdp.kBind('playerPlayed.uep', () => emitter.emit('play'));
          kdp.kBind('playerPaused.uep', () => emitter.emit('pause'));
          kdp.kBind('playerPlayEnd.uep', () => {
            if (!options.loop) emitter.emit('ended');
          });
          kdp.kBind('playerUpdatePlayhead.uep', (seconds) => {
            const duration = Number(kdp.evaluate('{duration}') ?? 0);
            emitter.emit('timeupdate', { currentTime: seconds, duration });
          });
          kdp.kBind('volumeChanged.uep', (volume) => {
            const normalizedVolume = volume > 1 ? volume / 100 : volume;
            emitter.emit('volumechange', { volume: normalizedVolume, muted: normalizedVolume === 0 });
          });

          emitter.emit('ready');

          // Flush any commands queued before initialization
          for (const fn of queue) fn(kdp);
          queue = [];
        },
      });

      resolve({
        play: () => runOrQueue((p) => p.sendNotification('doPlay')),
        pause: () => runOrQueue((p) => p.sendNotification('doPause')),
        seekTo: (seconds) => runOrQueue((p) => p.sendNotification('doSeek', seconds)),
        setVolume: (volume) => runOrQueue((p) => p.sendNotification('changeVolume', volume)),
        setPlaybackRate: () => {}, // Not supported natively in KDP
        destroy: () => {
          if (kdp) {
            kdp.kUnbind('.uep');
          }
          window.kWidget.destroy(container.id);
        },
      });
    });
  },
};
