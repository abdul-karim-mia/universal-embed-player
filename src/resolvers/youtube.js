// Embed parameter reference: https://developers.google.com/youtube/player_parameters
// Handles standard watch URLs, youtu.be short links, /embed/, /shorts/, /live/,
// and unlisted videos (unlisted videos use the same 11-char ID shape — there is
// no separate URL format, visibility is a server-side flag YouTube doesn't expose
// in the URL, so no special-casing is needed here).
//
// Embed params (modestbranding/rel/iv_load_policy/cc_load_policy/showinfo) and
// the t= start-time parse were cross-checked against Mux's youtube-video-element
// (github.com/muxinc/media-elements), the implementation react-player v3
// delegates to — see plan.md §0.1 for the competitive-research trail.
const YOUTUBE_HOST_RE = /(^|\.)youtube(-nocookie|education)?\.com$/;
const VIDEO_ID_RE = /^[\w-]{11}$/;
const START_TIME_RE = /[?&]t=([\dhms]+)/i;

function parseStartSeconds(url) {
  const match = url.match(START_TIME_RE);
  if (!match) return null;

  const value = match[1].toLowerCase();
  if (/^\d+$/.test(value)) return Number(value);

  const hours = value.match(/(\d+)h/);
  const minutes = value.match(/(\d+)m/);
  const seconds = value.match(/(\d+)s/);
  if (!hours && !minutes && !seconds) return null;

  return (
    (hours ? Number(hours[1]) * 3600 : 0) +
    (minutes ? Number(minutes[1]) * 60 : 0) +
    (seconds ? Number(seconds[1]) : 0)
  );
}

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

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  // Brand-minimization params (plan.md §7) — the provider's own embed
  // parameters, not a claim of removing chrome the browser can't reach.
  // controls=0 is the important one: without it, YouTube renders its own
  // full native title bar/progress bar/control row *underneath* our custom
  // Shadow-DOM control bar, producing visible double controls.
  embedUrl.searchParams.set('controls', '0');
  embedUrl.searchParams.set('modestbranding', '1');
  embedUrl.searchParams.set('rel', '0');
  embedUrl.searchParams.set('iv_load_policy', '3');
  embedUrl.searchParams.set('cc_load_policy', '1');
  embedUrl.searchParams.set('showinfo', '0');

  const startSeconds = parseStartSeconds(url);
  if (startSeconds) embedUrl.searchParams.set('start', String(startSeconds));

  return {
    provider: 'youtube',
    type: 'iframe',
    id,
    embedUrl: embedUrl.toString(),
    stability: 'stable',
  };
}
