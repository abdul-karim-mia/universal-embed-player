









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
