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

export {};
