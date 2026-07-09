// Embed parameter reference: https://developers.cloudflare.com/stream/viewing-videos/using-the-player-api/
// Handles the iframe.cloudflarestream.com/<uid> and watch.cloudflarestream.com/<uid>
// dashboard/share URL shapes. A direct .../manifest/video.m3u8 URL is NOT handled
// here — that's a plain HLS manifest and is already covered by resolvers/direct.js
// per the research finding in plan.md §0.1 (Mux/Cloudflare/Bunny all reduce to a
// generic .m3u8, no bespoke engine needed for the direct-manifest case).
const CF_STREAM_HOST_RE = /^(?:iframe|watch)\.cloudflarestream\.com$/;
const CF_STREAM_ID_RE = /^[a-zA-Z0-9]+$/;

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

  if (!CF_STREAM_HOST_RE.test(parsed.hostname)) return null;

  const id = parsed.pathname.split('/').filter(Boolean)[0];
  if (!id || !CF_STREAM_ID_RE.test(id)) return null;

  return {
    provider: 'cloudflare-stream',
    type: 'iframe',
    id,
    embedUrl: `https://iframe.cloudflarestream.com/${id}`,
    stability: 'stable',
  };
}
