// Embed parameter reference: https://developers.google.com/youtube/player_parameters
// Handles standard watch URLs, youtu.be short links, /embed/, /shorts/, /live/,
// and unlisted videos (unlisted videos use the same 11-char ID shape — there is
// no separate URL format, visibility is a server-side flag YouTube doesn't expose
// in the URL, so no special-casing is needed here).
const YOUTUBE_HOST_RE = /(^|\.)youtube(-nocookie|education)?\.com$/;
const VIDEO_ID_RE = /^[\w-]{11}$/;

/** @type {(url: string) => import('../core/types.js').ResolvedSource | null} */
export function resolve(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');
  let id = null;

  if (host === 'youtu.be') {
    id = parsed.pathname.slice(1).split('/')[0];
  } else if (YOUTUBE_HOST_RE.test(host)) {
    if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v');
    } else {
      const match = parsed.pathname.match(/^\/(embed|v|shorts|live)\/([^/?#]+)/);
      if (match) id = match[2];
    }
  } else {
    return null;
  }

  if (!id || !VIDEO_ID_RE.test(id)) return null;

  return {
    provider: 'youtube',
    type: 'iframe',
    id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    stability: 'stable',
  };
}
