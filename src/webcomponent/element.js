













import { createPlayer } from '../core/controller.js';
import { parseUepBoolean, parseUepJson, parseUepNumber, parsePlaybackRatesAttr } from './attr-utils.js';






const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};













const ATTR_DEFS = [
  { attr: 'url', prop: 'url', kind: 'string' },
  { attr: 'controls', prop: 'controls', kind: 'bool', default: true },
  { attr: 'light', prop: 'light', kind: 'bool', default: false },
  { attr: 'poster', prop: 'poster', kind: 'string' },
  { attr: 'autoplay', prop: 'autoplay', kind: 'bool', default: false },
  { attr: 'muted', prop: 'muted', kind: 'bool', default: false },
  { attr: 'loop', prop: 'loop', kind: 'bool', default: false },
  { attr: 'volume', prop: 'volume', kind: 'number' },
  { attr: 'volume-key', prop: 'volumeKey', kind: 'string' },
  { attr: 'video-size', prop: 'videoSize', kind: 'string', default: 'contain' },
  { attr: 'center-play-button', prop: 'centerPlayButton', kind: 'bool', default: false },
  { attr: 'loading-spinner', prop: 'loadingSpinner', kind: 'bool', default: true },
  { attr: 'shield', prop: 'shield', kind: 'bool', default: true },
  { attr: 'iframely-key', prop: 'iframelyKey', kind: 'string' },
  { attr: 'theme', prop: 'theme', kind: 'json' },
  { attr: 'seo', prop: 'seo', kind: 'json' },
  { attr: 'playback-rates', prop: 'playbackRates', kind: 'rates' },
];
const ATTR_DEF_BY_NAME = new Map(ATTR_DEFS.map((def) => [def.attr, def]));
const ATTR_DEF_BY_PROP = new Map(ATTR_DEFS.map((def) => [def.prop, def]));
const OBSERVED_ATTRS = ATTR_DEFS.map((def) => def.attr);





function applyLive(player, prop, value) {
  if (prop === 'volume') player.setVolume(value ?? 1);
  else if (prop === 'videoSize') player.setVideoSize(value ?? 'contain');
}
const LIVE_PROPS = new Set(['volume', 'videoSize']);

const EVENT_TYPES = ['ready', 'play', 'pause', 'buffering', 'timeupdate', 'volumechange', 'ratechange', 'ended', 'error'];





let _hostStyleInjected = false;
function ensureHostStyles() {
  if (_hostStyleInjected || typeof document === 'undefined') return;
  _hostStyleInjected = true;
  const s = document.createElement('style');
  s.id = 'uep-webcomponent-styles';
  s.textContent = `[data-uep-player] { display: block; position: relative; width: 100%; aspect-ratio: 16 / 9; }`;
  document.head.appendChild(s);
}

export class UepPlayerElement extends BaseElement {
  static get observedAttributes() {
    return OBSERVED_ATTRS;
  }

  #player = null;
  #mountDiv = null;
  #propertyOverrides = {};
  #onEvent = undefined;
  #connected = false;

  constructor() {
    super();
    ensureHostStyles();
    this.setAttribute('data-uep-player', '');
  }

  
  
  
  
  
  

  /** @returns {string | undefined} */
  get url() {
    return this.#getProp('url');
  }
  /** @param {string} value */
  set url(value) {
    this.#setProp('url', value);
  }

  /** @returns {boolean} */
  get controls() {
    return this.#getProp('controls');
  }
  /** @param {boolean} value */
  set controls(value) {
    this.#setProp('controls', value);
  }

  /** @returns {boolean} */
  get light() {
    return this.#getProp('light');
  }
  /** @param {boolean} value */
  set light(value) {
    this.#setProp('light', value);
  }

  /** @returns {string | undefined} */
  get poster() {
    return this.#getProp('poster');
  }
  /** @param {string} value */
  set poster(value) {
    this.#setProp('poster', value);
  }

  /** @returns {boolean} */
  get autoplay() {
    return this.#getProp('autoplay');
  }
  /** @param {boolean} value */
  set autoplay(value) {
    this.#setProp('autoplay', value);
  }

  /** @returns {boolean} */
  get muted() {
    return this.#getProp('muted');
  }
  /** @param {boolean} value */
  set muted(value) {
    this.#setProp('muted', value);
  }

  /** @returns {boolean} */
  get loop() {
    return this.#getProp('loop');
  }
  /** @param {boolean} value */
  set loop(value) {
    this.#setProp('loop', value);
  }

  /** @returns {number | undefined} */
  get volume() {
    return this.#getProp('volume');
  }
  /** @param {number} value */
  set volume(value) {
    this.#setProp('volume', value);
  }

  /** @returns {string | undefined} */
  get volumeKey() {
    return this.#getProp('volumeKey');
  }
  /** @param {string} value */
  set volumeKey(value) {
    this.#setProp('volumeKey', value);
  }

  /** @returns {'cover' | 'contain' | 'fill'} */
  get videoSize() {
    return this.#getProp('videoSize');
  }
  /** @param {'cover' | 'contain' | 'fill'} value */
  set videoSize(value) {
    this.#setProp('videoSize', value);
  }

  /** @returns {boolean} */
  get centerPlayButton() {
    return this.#getProp('centerPlayButton');
  }
  /** @param {boolean} value */
  set centerPlayButton(value) {
    this.#setProp('centerPlayButton', value);
  }

  /** @returns {boolean} */
  get loadingSpinner() {
    return this.#getProp('loadingSpinner');
  }
  /** @param {boolean} value */
  set loadingSpinner(value) {
    this.#setProp('loadingSpinner', value);
  }

  /** @returns {boolean} */
  get shield() {
    return this.#getProp('shield');
  }
  /** @param {boolean} value */
  set shield(value) {
    this.#setProp('shield', value);
  }

  /** @returns {string | undefined} */
  get iframelyKey() {
    return this.#getProp('iframelyKey');
  }
  /** @param {string} value */
  set iframelyKey(value) {
    this.#setProp('iframelyKey', value);
  }

  /** @returns {import('../core/types.js').PlayerTheme | undefined} */
  get theme() {
    return this.#getProp('theme');
  }
  /** @param {import('../core/types.js').PlayerTheme} value */
  set theme(value) {
    this.#setProp('theme', value);
  }

  /** @returns {import('../core/types.js').SeoMetadata | undefined} */
  get seo() {
    return this.#getProp('seo');
  }
  /** @param {import('../core/types.js').SeoMetadata} value */
  set seo(value) {
    this.#setProp('seo', value);
  }

  /** @returns {number[] | undefined} */
  get playbackRates() {
    return this.#getProp('playbackRates');
  }
  /** @param {number[]} value */
  set playbackRates(value) {
    this.#setProp('playbackRates', value);
  }

  /**
   * Callback fired for every unified event type — no attribute equivalent
   * (functions don't serialize). Same events are also dispatched as
   * `uep-<type>` CustomEvents (and a catch-all `uep-event`) on the element.
   * @returns {((event: import('../core/types.js').UnifiedPlayerEvent) => void) | undefined}
   */
  get onEvent() {
    return this.#onEvent;
  }
  /** @param {(event: import('../core/types.js').UnifiedPlayerEvent) => void} fn */
  set onEvent(fn) {
    this.#onEvent = fn;
  }

  #getProp(prop) {
    if (Object.prototype.hasOwnProperty.call(this.#propertyOverrides, prop)) {
      return this.#propertyOverrides[prop];
    }
    return this.#parseAttr(ATTR_DEF_BY_PROP.get(prop));
  }

  #setProp(prop, value) {
    this.#propertyOverrides[prop] = value;
    if (!this.#player) return;
    if (LIVE_PROPS.has(prop)) applyLive(this.#player, prop, value);
    else this.#mount();
  }

  #parseAttr(def) {
    const raw = this.getAttribute(def.attr);
    switch (def.kind) {
      case 'bool':
        return parseUepBoolean(raw, def.default);
      case 'number':
        return parseUepNumber(raw, def.default);
      case 'json':
        return raw !== null ? parseUepJson(raw, def.attr) : def.default;
      case 'rates':
        return parsePlaybackRatesAttr(raw) ?? def.default;
      default:
        return raw ?? def.default;
    }
  }

  connectedCallback() {
    this.#connected = true;
    
    
    
    
    
    
    queueMicrotask(() => {
      if (!this.#connected || this.#mountDiv) return;
      this.#mount();
    });
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#player?.destroy();
    this.#player = null;
    this.#mountDiv = null;
  }

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.#player) return;
    const def = ATTR_DEF_BY_NAME.get(name);
    if (!def) return;
    if (LIVE_PROPS.has(def.prop)) applyLive(this.#player, def.prop, this[def.prop]);
    else this.#mount();
  }

  #buildOptions() {
    const options = {};
    for (const def of ATTR_DEFS) {
      const value = this[def.prop];
      if (value !== undefined) options[def.prop] = value;
    }
    if (this.#onEvent) options.onEvent = this.#onEvent;
    return options;
  }

  #mount() {
    this.#player?.destroy();
    const options = this.#buildOptions();
    const userOnEvent = options.onEvent;
    options.onEvent = (event) => {
      this.dispatchEvent(new CustomEvent(`uep-${event.type}`, { detail: event, bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('uep-event', { detail: event, bubbles: true, composed: true }));
      userOnEvent?.(event);
    };

    this.innerHTML = '';
    this.#mountDiv = document.createElement('div');
    Object.assign(this.#mountDiv.style, { position: 'absolute', inset: '0' });
    this.append(this.#mountDiv);

    this.#player = createPlayer(this.#mountDiv, options);
  }

  
  play() {
    this.#player?.play();
  }
  pause() {
    this.#player?.pause();
  }
  /** @param {number} seconds */
  seekTo(seconds) {
    this.#player?.seekTo(seconds);
  }
  /** @param {number} volume */
  setVolume(volume) {
    this.#player?.setVolume(volume);
  }
  /** @param {number} rate */
  setPlaybackRate(rate) {
    this.#player?.setPlaybackRate(rate);
  }
  /** @param {'cover' | 'contain' | 'fill'} size */
  setVideoSize(size) {
    this.#player?.setVideoSize(size);
  }
  mute() {
    this.#player?.mute();
  }
  unmute() {
    this.#player?.unmute();
  }
  toggleMute() {
    this.#player?.toggleMute();
  }
  /**
   * @param {string} type
   * @param {(event: import('../core/types.js').UnifiedPlayerEvent) => void} handler
   * @returns {() => void}
   */
  on(type, handler) {
    return this.#player?.on(type, handler) ?? (() => {});
  }
  /**
   * @param {string} type
   * @param {(event: import('../core/types.js').UnifiedPlayerEvent) => void} handler
   */
  off(type, handler) {
    this.#player?.off(type, handler);
  }
  /** @returns {Promise<void>} */
  get ready() {
    return this.#player?.ready ?? Promise.resolve();
  }
}



export const WEBCOMPONENT_EVENT_TYPES = EVENT_TYPES;
