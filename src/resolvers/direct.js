// Extension-based fallback for raw infrastructure: HLS (.m3u8), DASH (.mpd),
// and plain MP4/WebM/Ogg/MOV files. Regex adapted from react-player's
// patterns.js (AUDIO_EXTENSIONS/VIDEO_EXTENSIONS/HLS_EXTENSIONS/DASH_EXTENSIONS),
// verified during competitive research — see plan.md §0.1. This resolver runs
// last in the registry (src/resolvers/index.js) so any host-specific resolver
// gets first chance to match.
const VIDEO_EXT_RE = /\.(mp4|og[gv]|webm|mov|m4v)(#t=[\d,.]+)?($|\?)/i;
const HLS_EXT_RE = /\.(m3u8)($|\?)/i;
const DASH_EXT_RE = /\.(mpd)($|\?)/i;

/** @type {(url: string) => import('../core/types.js').ResolvedSource | null} */
export function resolve(url) {
  if (HLS_EXT_RE.test(url)) {
    return { provider: 'hls', type: 'hls', src: url, stability: 'stable' };
  }
  if (DASH_EXT_RE.test(url)) {
    return { provider: 'dash', type: 'dash', src: url, stability: 'stable' };
  }
  if (VIDEO_EXT_RE.test(url)) {
    return { provider: 'direct', type: 'native', src: url, stability: 'stable' };
  }
  return null;
}
