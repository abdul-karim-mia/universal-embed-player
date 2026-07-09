// Handles onedrive.live.com/embed?... (rewritten to the /download path) and the
// 1drv.ms short-link shape. Short links resolve via a normal HTTP redirect that
// the <video> element's own network request follows natively — no JS-side
// redirect-following is needed, so this stays a synchronous, pure resolver like
// every other provider except icloud.js (see rules.md §2 resolver contract).
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

  if (host === '1drv.ms') {
    return {
      provider: 'onedrive',
      type: 'native',
      src: url,
      stability: 'experimental',
    };
  }

  if (host !== 'onedrive.live.com') return null;

  const isEmbed = parsed.pathname.includes('/embed');
  parsed.pathname = parsed.pathname.replace('/embed', '/download');

  return {
    provider: 'onedrive',
    type: 'native',
    src: parsed.toString(),
    stability: isEmbed ? 'stable' : 'experimental',
  };
}
