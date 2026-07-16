





const VIDEO_EXT_RE = /\.(mp4|og[gv]|webm|mov|m4v)(#t=[\d,.]+)?($|\?)/i;
const HLS_EXT_RE = /\.(m3u8)($|\?)/i;
const DASH_EXT_RE = /\.(mpd)($|\?)/i;

/**
 * @param {string} url
 * @returns {import('../core/types.js').ResolvedSource | null}
 */
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
