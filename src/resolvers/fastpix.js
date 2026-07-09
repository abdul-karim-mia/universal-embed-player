// Embed parameter reference: https://docs.fastpix.io/docs/embed-your-video
// FastPix (built on Mux) exposes two parallel URL shapes:
//   - Iframe:   https://play.fastpix.{io,com}/?playbackId=<ID>
//   - HLS:      https://stream.fastpix.{io,com}/<ID>.m3u8
// We resolve the iframe URL directly to the HLS manifest for native
// playback (full controllability).  Direct .m3u8 URLs on stream.fastpix.*
// are NOT claimed here — they fall through to resolvers/direct.js.
//
// Thumbnail poster:
//   https://images.fastpix.com/<ID>/thumbnail.jpg?time=1
//
// Spritesheet (timeline hover previews):
//   https://images.fastpix.com/<ID>/spritesheet.jpg
const FASTPIX_PLAY_HOST_RE = /^play\.fastpix\.(?:io|com)$/;
const FASTPIX_ID_RE = /^[\w-]+$/;

/** @param {string} url @returns {import('../core/types.js').ResolvedSource | null} */
export function resolve(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!FASTPIX_PLAY_HOST_RE.test(parsed.hostname)) return null;

  const id = parsed.searchParams.get('playbackId');
  if (!id || !FASTPIX_ID_RE.test(id)) return null;

  return {
    provider: 'fastpix',
    type: 'hls',
    id,
    src: `https://stream.fastpix.io/${id}.m3u8`,
    stability: 'stable',
  };
}
