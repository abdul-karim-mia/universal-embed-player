// Handles dropbox.com/s/<id>/<name>?dl=0 and the newer /scl/fi/<id>/<name>?dl=0
// share-link shapes. The dl=0 -> raw=1 rewrite is documented by Dropbox as the
// supported way to get a direct, embeddable byte stream instead of the preview page.
//
// mimeType is set from the URL's own file extension (verified against a real
// share link) because Dropbox's usercontent CDN mislabels the raw=1 response
// as Content-Type: application/json even though the bytes are genuinely the
// video — combined with the X-Content-Type-Options: nosniff header it also
// sends, an unadorned `video.src` trusts that bogus type and refuses to play.
// A <source type> (native.js) overrides it with the real type instead.
const EXT_MIME_TYPES = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
};

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
  if (host !== 'dropbox.com') return null;
  if (!/^\/(s|scl\/fi)\//.test(parsed.pathname)) return null;

  parsed.searchParams.delete('dl');
  parsed.searchParams.set('raw', '1');

  const extMatch = parsed.pathname.match(/\.([a-z0-9]+)$/i);
  const mimeType = extMatch ? EXT_MIME_TYPES[extMatch[1].toLowerCase()] : undefined;

  return {
    provider: 'dropbox',
    type: 'native',
    src: parsed.toString(),
    ...(mimeType ? { mimeType } : {}),
    stability: 'stable',
  };
}
