// Dailymotion resolver — extracts video ID from dailymotion.com/video/ID_slug
// and dai.ly/ID short links. The embed URL uses Dailymotion's new embed
// endpoint at geo.dailymotion.com (migration guide:
// developers.dailymotion.com/reference/migration-guide-new-embed-endpoint).
// Since Feb 3, 2026 the legacy www.dailymotion.com/embed/video/X URL
// redirects to geo.dailymotion.com/player.html?video=X — we emit the new
// URL directly to avoid the redirect hop and preserve query params.
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
    embedUrl: `https://geo.dailymotion.com/player.html?video=${id}`,
    stability: 'stable',
  };
}
