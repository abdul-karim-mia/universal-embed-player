












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
