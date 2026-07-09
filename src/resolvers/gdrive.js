// Handles drive.google.com/file/d/<id>/view and the older open?id=/uc?id= shapes.
// Known fragility (see plan.md §8): the uc?export=view endpoint can show a
// "can't scan for viruses" interstitial for files >100MB and is rate-limited —
// this resolver is marked 'stable' for the URL transform itself, but consumers
// should still handle the controller's onResolveError callback for large files.
const GDRIVE_ID_RE = /^[\w-]+$/;

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

  if (parsed.hostname !== 'drive.google.com') return null;

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
    type: 'native',
    id,
    src: `https://drive.google.com/uc?export=view&id=${id}`,
    stability: 'stable',
  };
}
