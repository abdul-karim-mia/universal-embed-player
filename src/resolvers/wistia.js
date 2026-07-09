// Embed parameter reference: https://wistia.com/support/developers/embed-options
// Pattern adapted from react-player's MATCH_URL_WISTIA (verified against its
// dist/patterns.js during competitive research, see plan.md §0.1).
const WISTIA_RE = /(?:wistia\.(?:com|net)|wi\.st)\/(?:medias|embed)\/(?:iframe\/)?([^/?#]+)/i;
const WISTIA_ID_RE = /^[\w-]+$/;

/**
 * @param {string} url
 * @returns {import('../core/types.js').ResolvedSource | null}
 */
export function resolve(url) {
  const match = url.match(WISTIA_RE);
  if (!match) return null;

  const id = match[1];
  if (!WISTIA_ID_RE.test(id)) return null;

  return {
    provider: 'wistia',
    type: 'iframe',
    id,
    embedUrl: `https://fast.wistia.net/embed/iframe/${id}`,
    stability: 'stable',
  };
}
