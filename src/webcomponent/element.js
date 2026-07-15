// <uep-player> — native custom element wrapping createPlayer. Works in any
// framework (Angular, Svelte, Solid, plain HTML) with zero adapter of its
// own — this file plus index.js's registration IS the "adapter."
//
// No Shadow DOM on the host element itself (controls.js's own internal
// shadow root, for the control bar, is unrelated and unaffected). The host
// element's light-DOM content is unconditionally cleared and replaced on
// mount, same contract as vanilla createPlayer's `container.innerHTML = ''`
// — see README "Video SEO" for the documented recipe of writing real
// fallback markup (a poster <a><img>) as light-DOM children in static HTML
// for crawler visibility before upgrade, deliberately not auto-parsed here
// (see plan notes: the `seo` property/attribute is the structured, documented
// path for that data — inventing implicit markup-shape parsing would be new,
// undocumented behavior).
import { createPlayer } from '../core/controller.js';
import { parseUepBoolean, parseUepJson, parseUepNumber, parsePlaybackRatesAttr } from './attr-utils.js';

// SSR guard: importing this module in Node must not crash on `class X
// extends HTMLElement` — HTMLElement doesn't exist there. Mirrors
// controller.js's createNoopPlayer() SSR posture: the class is simply never
// meaningfully instantiated server-side (index.js's registration is itself
// guarded by `typeof customElements !== 'undefined'`).
const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

// attr: HTML attribute name (kebab-case) | prop: JS property name (camelCase)
// kind: how to parse the attribute string | default: value when attribute is absent
//
// Drives #getProp()/#setProp()/#parseAttr()/attributeChangedCallback() below
// — but each property still needs its own real `get`/`set` declaration in
// the class body (not generated from this array at runtime) because tsc's
// JSDoc-based declaration emit can't infer types from a dynamic
// Object.defineProperty loop; a loop-generated accessor produces a silently
// incomplete .d.ts (verified while building this file — @property tags on
// the class docblock don't fix it either, TS doesn't support that for plain
// ES class declarations). The actual get/set *behavior* stays de-duplicated
// through #getProp()/#setProp() below; only the type-carrying syntax repeats.
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

// Options with an existing live-update path on the createPlayer return value
// (core/controller.js) — changing these attribute/property re-applies via
// that method instead of a full destroy+remount. Everything else remounts,
// matching the React/Vue adapters' "only structural changes remount" model.
function applyLive(player, prop, value) {
  if (prop === 'volume') player.setVolume(value ?? 1);
  else if (prop === 'videoSize') player.setVideoSize(value ?? 'contain');
}
const LIVE_PROPS = new Set(['volume', 'videoSize']);

const EVENT_TYPES = ['ready', 'play', 'pause', 'buffering', 'timeupdate', 'volumechange', 'ratechange', 'ended', 'error'];

// Singleton stylesheet, same pattern as lazy.js's ensureGlowStyles() and
// spinner.js's ensureSpinnerStyles() — targets a self-applied data attribute
// rather than the tag name, since UepPlayerElement can be registered under
// any tag via customElements.define (not only 'uep-player').
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

  // ── Property accessors ─────────────────────────────────────────────────
  // Property value wins over the attribute when explicitly set; falls
  // through to parsing the live attribute otherwise. Each pair is a thin,
  // typed wrapper over #getProp()/#setProp() so the actual logic lives in
  // exactly one place (see the ATTR_DEFS comment above for why these can't
  // be generated in a loop and still produce correct types).

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
    // connectedCallback can fire the instant the opening tag is inserted,
    // before light-DOM children (e.g. a documented SEO fallback <a><img>
    // written directly in the consumer's own HTML) have been parsed — a
    // race React/Vue's effect/commit-tied mounting never has. A microtask
    // is guaranteed to run after the parser finishes inserting this
    // element's whole subtree, the standard mitigation.
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

  // ── Imperative API — 1:1 mirror of UepPlayer (core/types.js) ──────────
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

// Exposed for tests/documentation — every unified event type is dispatched
// as `uep-<type>` per the class's #mount() wiring above.
export const WEBCOMPONENT_EVENT_TYPES = EVENT_TYPES;
