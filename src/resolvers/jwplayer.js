// Embed parameter reference: https://developer.jwplayer.com/jw-player/docs/developer-guide/getting-started/add-an-html5-player/
// Handles the documented cdn.jwplayer.com/players/<mediaId>-<playerId>.html
// and content.jwplatform.com/players/<mediaId>-<playerId>.html iframe shapes.
const JW_HOST_RE = /(^|\.)jwplayer\.com$|(^|\.)jwplatform\.com$/;
const JW_PATH_RE = /^\/players\/([\w]+)-([\w]+)\.html$/;

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

  const match = parsed.pathname.match(JW_PATH_RE);
  if (!match) return null;

  const [, mediaId, playerId] = match;

  return {
    provider: 'jwplayer',
    type: 'iframe',
    id: mediaId,
    embedUrl: `https://cdn.jwplayer.com/players/${mediaId}-${playerId}.html`,
    stability: 'stable',
  };
}
