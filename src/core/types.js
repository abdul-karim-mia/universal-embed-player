/**
 * @typedef {'native'|'iframe'|'hls'|'dash'} SourceType
 *
 * @typedef {Object} ResolvedSource
 * @property {string} provider           - resolver id, e.g. 'youtube', 'dropbox'
 * @property {SourceType} type           - which engine should mount this source
 * @property {string} [src]              - direct playable URL (native/hls/dash)
 * @property {string} [mimeType]          - explicit MIME type for native sources whose real type a
 *   browser can't safely infer (e.g. Dropbox's raw=1 links mislabel Content-Type); set as a
 *   <source type> so the browser doesn't have to guess and skip the resource
 * @property {string} [embedUrl]         - iframe URL (iframe type only)
 * @property {string} [poster]           - deterministic poster image URL from the resolver
 * @property {string} [id]               - extracted provider-native ID, if any
 * @property {'stable'|'experimental'} stability - see plan.md §8 fragility notes
 */

/**
 * @typedef {Object} UnifiedPlayerEvent
 * @property {string} type
 * @property {number} [currentTime]
 * @property {number} [duration]
 * @property {number} [volume]
 * @property {boolean} [muted]
 * @property {number} [rate]
 * @property {string} [code]
 * @property {string} [message]
 * @property {string} [provider]
 */

/**
 * @typedef {Object} PlayerTheme
 * @property {string} [primaryColor] - CSS var --uep-primary-color, default #6d5efc
 * @property {string} [accentColor] - CSS var --uep-accent-color, default #ffffff
 * @property {string} [fontFamily] - CSS var --uep-font-family, default system-ui, sans-serif
 * @property {string} [barBackground] - CSS var --uep-bar-bg, default rgba(20, 18, 32, 0.55)
 * @property {string} [barRadius] - CSS var --uep-bar-radius, default 999px
 * @property {string} [barBlur] - CSS var --uep-bar-blur, default 10px
 * @property {string} [barPadding] - CSS var --uep-bar-padding, default 5px 10px
 * @property {string} [barMargin] - CSS var --uep-bar-margin, default 8px
 * @property {string} [buttonSize] - CSS var --uep-btn-size, default 26px
 * @property {string} [sliderHeight] - CSS var --uep-slider-height, default 3px
 * @property {string} [timeFontSize] - CSS var --uep-time-size, default 11px
 */

/**
 * @typedef {Object} GlowStyle
 * @property {string} [color1] - first gradient stop, default #0e0b16
 * @property {string} [color2] - second gradient stop, default #1a1040
 * @property {string} [color3] - third gradient stop, default #2a1b4e
 * @property {string} [color4] - fourth gradient stop, default #3b185f
 * @property {string} [angle] - gradient angle, default -45deg
 * @property {string} [speed] - animation duration, default 12s
 */

/**
 * @typedef {Object} SeoMetadata
 * @property {string} name - video title; required, nothing is emitted without it
 * @property {string} [description] - falls back to `name` if omitted
 * @property {string} [thumbnailUrl] - falls back to the resolved provider poster if omitted
 * @property {string} [uploadDate] - ISO 8601 date/datetime, e.g. '2026-01-15'
 * @property {number} [durationSeconds] - converted to ISO 8601 duration (e.g. 93 -> 'PT1M33S')
 */

/**
 * @typedef {Object} PlayerOptions
 * @property {string} url
 * @property {boolean} [controls]
 * @property {boolean} [light] - thumbnail-first mode toggle; defers engine mounting until clicked
 * @property {string} [poster] - custom poster image URL; falls back to a provider default if omitted (see core/lazy.js)
 * @property {boolean} [glowingPlaceholder] - light mode only. true always shows the animated glow (even over a poster), false never shows it, unset shows it only while there's no static poster image yet. Vanilla createPlayer only — not forwarded by the React/Vue/Svelte/Web Component adapters.
 * @property {GlowStyle} [glowStyle] - light mode only. Overrides the glow gradient's colors/angle/speed (see core/lazy.js). Same vanilla-only caveat as glowingPlaceholder.
 * @property {boolean} [autoplay]
 * @property {boolean} [muted]
 * @property {boolean} [loop]
 * @property {number[]} [playbackRates]
 * @property {number} [volume]
 * @property {string} [volumeKey]
 * @property {'cover' | 'contain' | 'fill'} [videoSize] - video display sizing style. 'cover' (fill/cover), 'contain' (fit/contain, default), or 'fill' (stretch).
 * @property {boolean} [centerPlayButton] - display a custom play/pause button in the center of the player, default false.
 * @property {boolean} [loadingSpinner] - show a loading/buffering spinner overlay while the engine mounts and during any 'buffering' event, default true.
 * @property {PlayerTheme} [theme]
 * @property {boolean} [shield]
 * @property {string} [iframelyKey] - opt-in last-resort fallback (core/iframely-fallback.js): only tried when every built-in resolver returns null. Must be Iframely's client-safe hashed key (iframely.com/docs/allow-origins), never a raw private API key — this package never bundles Iframely credentials of its own (rules.md §7.3).
 * @property {SeoMetadata} [seo] - opt-in VideoObject JSON-LD. In vanilla `createPlayer`, this only benefits crawlers that execute JavaScript (documented Googlebot behavior; most others don't) since the script tag is injected client-side — the React/Vue adapters render the same JSON-LD server-side instead, which works for every crawler.
 * @property {(event: UnifiedPlayerEvent) => void} [onEvent]
 */

/**
 * @typedef {Object} UepPlayer
 * @property {() => void} play
 *   Start playback. Autoplay-policy rejections are emitted as an 'error' event
 *   rather than thrown.
 * @property {() => void} pause
 * @property {(seconds: number) => void} seekTo
 *   Seek to `seconds` (clamped to [0, ∞)). Non-finite values are ignored with
 *   a console.warn.
 * @property {(volume: number) => void} setVolume
 *   Set volume in [0, 1]. Out-of-range values are clamped; non-finite values
 *   are ignored. Passing a value > 0 while muted automatically unmutes.
 * @property {(rate: number) => void} setPlaybackRate
 *   Set playback rate (clamped to [0.0625, 16]). Non-positive or non-finite
 *   values are ignored with a console.warn.
 * @property {(size: 'cover' | 'contain' | 'fill') => void} setVideoSize
 *   Set video display sizing style dynamically.
 * @property {() => void} mute
 *   Mute audio, remembering the current volume for later restoration. Idempotent.
 * @property {() => void} unmute
 *   Unmute audio, restoring the pre-mute volume. Idempotent.
 * @property {() => void} toggleMute
 *   Toggle between muted and unmuted.
 * @property {(type: string, handler: (event: UnifiedPlayerEvent) => void) => (() => void)} on
 *   Subscribe to a player event. Returns an unsubscribe function. Unknown event
 *   types emit a console.warn and return a no-op unsubscriber rather than throwing.
 * @property {(type: string, handler: (event: UnifiedPlayerEvent) => void) => void} off
 * @property {() => void} destroy
 *   Tear down the player. Idempotent — safe to call multiple times.
 * @property {Promise<void>} ready
 *   Resolves when the engine has fully mounted (or the light-mode poster is
 *   displayed). Engine errors emit via the 'error' event rather than rejecting.
 */

export {};
