// Embed parameter reference: https://developer.vimeo.com/player/sdk/embed
// Handles vimeo.com/ID, vimeo.com/ID/HASH (unlisted/private-hash share links),
// and already-built player.vimeo.com/video/ID embed URLs.
const VIMEO_PATH_RE = /^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/;
const HASH_RE = /^[a-zA-Z0-9]+$/;

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
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;

  const match = parsed.pathname.match(VIMEO_PATH_RE);
  if (!match) return null;

  const id = match[1];
  // The private/unlisted hash can arrive either in the path (vimeo.com/ID/HASH,
  // the "Share" link shape) or as a `h` query param (player.vimeo.com/video/ID?h=HASH,
  // the shape Vimeo's own embed-code/oEmbed generator outputs) — cross-checked
  // against Plyr's parseHash, which reads both. Only reading the path form
  // previously dropped the hash silently whenever a caller passed through
  // Vimeo's own canonical embed URL, breaking private/unlisted playback.
  const hash = match[2] || parsed.searchParams.get('h');
  if (hash && !HASH_RE.test(hash)) return null;

  const embed = new URL(`https://player.vimeo.com/video/${id}`);
  if (hash) embed.searchParams.set('h', hash);
  // Brand-minimization params (plan.md §7), Vimeo's own documented embed
  // parameters. `controls=0` is only honored on Plus/Pro/Business accounts
  // (a Vimeo account-tier restriction, not something we can work around) but
  // is harmless to send for everyone else — the interaction shield
  // (core/ui/shield.js) already intercepts clicks regardless of whether
  // Vimeo's own control bar renders underneath.
  embed.searchParams.set('byline', '0');
  embed.searchParams.set('portrait', '0');
  embed.searchParams.set('title', '0');
  embed.searchParams.set('controls', '0');
  // Plays inline on iOS instead of forcing fullscreen (same reasoning as the
  // YouTube resolver — cross-checked against Plyr's iOS handling).
  embed.searchParams.set('playsinline', '1');

  return {
    provider: 'vimeo',
    type: 'iframe',
    id,
    embedUrl: embed.toString(),
    stability: 'stable',
  };
}
