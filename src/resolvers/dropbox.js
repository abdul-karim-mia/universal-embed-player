// Handles dropbox.com/s/<id>/<name>?dl=0 and the newer /scl/fi/<id>/<name>?dl=0
// share-link shapes. The dl=0 -> raw=1 rewrite is documented by Dropbox as the
// supported way to get a direct, embeddable byte stream instead of the preview page.
/** @type {(url: string) => import('../core/types.js').ResolvedSource | null} */
export function resolve(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');
  if (host !== 'dropbox.com') return null;
  if (!/^\/(s|scl\/fi)\//.test(parsed.pathname)) return null;

  parsed.searchParams.delete('dl');
  parsed.searchParams.set('raw', '1');

  return {
    provider: 'dropbox',
    type: 'native',
    src: parsed.toString(),
    stability: 'stable',
  };
}
