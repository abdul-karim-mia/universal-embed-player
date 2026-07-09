// Embed parameter reference: https://developer.vimeo.com/player/sdk/embed
// Handles vimeo.com/ID, vimeo.com/ID/HASH (unlisted/private-hash share links),
// and already-built player.vimeo.com/video/ID embed URLs.
const VIMEO_PATH_RE = /^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/;

/** @type {(url: string) => import('../core/types.js').ResolvedSource | null} */
export function resolve(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;

  const match = parsed.pathname.match(VIMEO_PATH_RE);
  if (!match) return null;

  const id = match[1];
  const hash = match[2];

  const embed = new URL(`https://player.vimeo.com/video/${id}`);
  if (hash) embed.searchParams.set('h', hash);

  return {
    provider: 'vimeo',
    type: 'iframe',
    id,
    embedUrl: embed.toString(),
    stability: 'stable',
  };
}
