// EXPERIMENTAL — see plan.md §8. iCloud public share links resolve through a
// redirect chain that isn't a static string rewrite (unlike Drive/Dropbox/OneDrive),
// so this resolver only recognizes the share-link shape and passes it through
// as-is; the <video> element's own network layer follows the redirect. This is
// the one documented "best effort, not guaranteed" resolver in the matrix.
const ICLOUD_HOST_RE = /(^|\.)icloud\.com$/;

/** @type {(url: string) => import('../core/types.js').ResolvedSource | null} */
export function resolve(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!ICLOUD_HOST_RE.test(parsed.hostname)) return null;
  if (!parsed.pathname.includes('/iclouddrive')) return null;

  return {
    provider: 'icloud',
    type: 'native',
    src: url,
    stability: 'experimental',
  };
}
