// Google Drive — CSP: frame-src https://drive.google.com; no media-src/connect-src
// needed, this is iframe-only (rules.md §7.4).
//
// Distinct from the Drive resolver that was removed (plan.md §8): that one
// tried `type: 'native'` playback of a raw-bytes URL rewrite, the same shape
// as dropbox.js, and was reverted because Drive's modern share links commonly
// point at non-"faststart" MP4s that hang on `buffering` regardless of
// resolver correctness. This resolver takes a different path — it points at
// Drive's own `/preview` iframe (the same UI Drive's web app itself uses),
// so Drive handles playback, not us. That sidesteps the faststart problem,
// but Google publishes no postMessage API or JS SDK for this iframe at all
// (unlike YouTube/Vimeo), so there is no protocol adapter for it and it
// mounts via the engine's existing no-adapter fallback (src/core/engines/
// iframe.js's `PROTOCOLS[...] ?? null` branch) with `controllable: false` —
// Drive's native chrome shows through unmodified, and no `createPlayer`
// command (play/pause/seek/volume) does anything. No autoplay parameter is
// set: Google documents none for this endpoint, and rules.md §4.2 requires
// citing real documentation for any embed parameter this resolver sets.

const GDRIVE_ID_RE = /^[\w-]{10,}$/;

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
  if (host !== 'drive.google.com' && host !== 'docs.google.com') return null;

  let id = null;
  const fileMatch = parsed.pathname.match(/^\/file\/d\/([^/]+)/);
  if (fileMatch) {
    id = fileMatch[1];
  } else if (parsed.pathname === '/open' || parsed.pathname === '/uc') {
    id = parsed.searchParams.get('id');
  }

  if (!id || !GDRIVE_ID_RE.test(id)) return null;

  return {
    provider: 'gdrive',
    type: 'iframe',
    id,
    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
    stability: 'experimental',
  };
}
