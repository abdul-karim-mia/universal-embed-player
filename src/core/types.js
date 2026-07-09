/**
 * @typedef {'native'|'iframe'|'hls'|'dash'} SourceType
 *
 * @typedef {Object} ResolvedSource
 * @property {string} provider           - resolver id, e.g. 'youtube', 'gdrive'
 * @property {SourceType} type           - which engine should mount this source
 * @property {string} [src]              - direct playable URL (native/hls/dash)
 * @property {string} [embedUrl]         - iframe URL (iframe type only)
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
 * @property {boolean | string} [light]
 * @property {boolean} [autoplay]
 * @property {boolean} [muted]
 * @property {boolean} [loop]
 * @property {number[]} [playbackRates]
 * @property {number} [volume]
 * @property {string} [volumeKey]
 * @property {PlayerTheme} [theme]
 * @property {boolean} [shield]
 * @property {boolean} [allowBrandMasking] - opt-in, off by default; see core/ui/brand-mask.js
 * @property {(event: UnifiedPlayerEvent) => void} [onEvent]
 */

/**
 * @typedef {Object} UepPlayer
 * @property {() => void} play
 * @property {() => void} pause
 * @property {(seconds: number) => void} seekTo
 * @property {(volume: number) => void} setVolume
 * @property {(rate: number) => void} setPlaybackRate
 * @property {(type: string, handler: (event: UnifiedPlayerEvent) => void) => (() => void)} on
 * @property {(type: string, handler: (event: UnifiedPlayerEvent) => void) => void} off
 * @property {() => void} destroy
 * @property {Promise<void>} ready
 */

export {};
