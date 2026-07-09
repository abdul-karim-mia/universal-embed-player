// Embed parameter reference: https://developer.jwplayer.com/jw-player/docs/developer-guide/getting-started/add-an-html5-player/
// Handles documented URL shapes:
//   cdn.jwplayer.com/players/<mediaId>-<playerId>.html  (iframe)
//   cdn.jwplayer.com/manifests/<mediaId>.m3u8           (HLS manifest, direct)
// plus content.jwplatform.com equivalents for both.
const JW_HOST_RE = /(^|\.)jwplayer\.com$|(^|\.)jwplatform\.com$/;
const JW_IFRAME_PATH_RE = /^\/players\/([\w]+)-([\w]+)\.html$/;
const JW_HLS_PATH_RE = /^\/manifests\/([\w]+)\.m3u8$/;

/**
 * @param {string} url
 * @returns {import('../core/types.js').ResolvedSource | null}
 */
export function resolve(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!JW_HOST_RE.test(parsed.hostname)) return null;

  let mediaId;
  let src;

  const iframeMatch = parsed.pathname.match(JW_IFRAME_PATH_RE);
  if (iframeMatch) {
    mediaId = iframeMatch[1];
    src = `https://cdn.jwplayer.com/manifests/${mediaId}.m3u8`;
  }

  const hlsMatch = parsed.pathname.match(JW_HLS_PATH_RE);
  if (hlsMatch) {
    mediaId = hlsMatch[1];
    src = parsed.href;
  }

  if (!mediaId) return null;

  return {
    provider: 'jwplayer',
    type: 'hls',
    id: mediaId,
    src,
    poster: `https://cdn.jwplayer.com/v2/media/${mediaId}/poster.jpg?width=720`,
    stability: 'stable',
  };
}
