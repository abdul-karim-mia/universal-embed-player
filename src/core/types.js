/**
 * @typedef {'native'|'iframe'|'hls'|'dash'} SourceType
 *
 * @typedef {Object} ResolvedSource
 * @property {string} provider           - resolver id, e.g. 'youtube', 'gdrive'
 * @property {SourceType} type           - which engine should mount this source
 * @property {string} [src]              - direct playable URL (native/hls/dash)
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
 * @property {string} [primaryColor]
 * @property {string} [accentColor]
 * @property {string} [fontFamily]
 */

/**
 * @typedef {Object} PlayerOptions
 * @property {string} url
 * @property {boolean} [controls]
 * @property {boolean} [light] - thumbnail-first mode toggle; defers engine mounting until clicked
 * @property {string} [poster] - custom poster image URL; falls back to a provider default if omitted (see core/lazy.js)
 * @property {boolean} [autoplay]
 * @property {boolean} [muted]
 * @property {boolean} [loop]
 * @property {number[]} [playbackRates]
 * @property {number} [volume]
 * @property {string} [volumeKey]
 * @property {'cover' | 'contain' | 'fill'} [videoSize] - video display sizing style. 'cover' (fill/cover), 'contain' (fit/contain, default), or 'fill' (stretch).
 * @property {boolean} [centerPlayButton] - display a custom play/pause button in the center of the player, default false.
 * @property {PlayerTheme} [theme]
 * @property {boolean} [shield]
 * @property {string} [iframelyKey] - opt-in last-resort fallback (core/iframely-fallback.js): only tried when every built-in resolver returns null. Must be Iframely's client-safe hashed key (iframely.com/docs/allow-origins), never a raw private API key — this package never bundles Iframely credentials of its own (rules.md §7.3).
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
