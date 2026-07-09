// Embed parameter reference: https://developer.dailymotion.com/player/
// Handles dailymotion.com/video/ID_slug and the dai.ly/ID short link.
const DAILYMOTION_ID_RE = /^[a-zA-Z0-9]+$/;

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

  const host = parsed.hostname.replace(/^www\./, '');
  let id = null;

  if (host === 'dai.ly') {
    id = parsed.pathname.slice(1).split('/')[0];
  } else if (/(^|\.)dailymotion\.com$/.test(host)) {
    const match = parsed.pathname.match(/^\/video\/([a-zA-Z0-9_]+)/);
    if (match) id = match[1].split('_')[0];
  } else {
    return null;
  }

  if (!id || !DAILYMOTION_ID_RE.test(id)) return null;

  return {
    provider: 'dailymotion',
    type: 'iframe',
    id,
    embedUrl: `https://www.dailymotion.com/embed/video/${id}`,
    stability: 'stable',
  };
}
