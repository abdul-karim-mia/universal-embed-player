// Embed parameter reference: https://docs.fastpix.io/docs/embed-your-video
// Handles the play.fastpix.io dashboard/share iframe URL shape. A direct
// stream.fastpix.io/<id>.m3u8 URL is NOT handled here — that's a plain HLS
// manifest already covered by resolvers/direct.js (same pattern as
// Cloudflare Stream/Mux, see plan.md §0.1/§0.3: no bespoke engine needed for
// the direct-manifest case).
const FASTPIX_ID_RE = /^[\w-]+$/;

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

  if (parsed.hostname !== 'play.fastpix.io') return null;

  const id = parsed.searchParams.get('playbackId');
  if (!id || !FASTPIX_ID_RE.test(id)) return null;

  return {
    provider: 'fastpix',
    type: 'iframe',
    id,
    embedUrl: `https://play.fastpix.io/?playbackId=${id}`,
    stability: 'stable',
  };
}
