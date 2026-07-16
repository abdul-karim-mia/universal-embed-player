const CF_SHORT_HOST_RE = /^(?:iframe|watch)\.(?:cloudflarestream|videodelivery)\.com$/;
const CF_CUSTOMER_HOST_RE = /^customer-([a-z0-9]+)\.(?:cloudflarestream|videodelivery)\.com$/;
const CF_ID_RE = /^[a-zA-Z0-9]+$/;

export function resolve(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname;

  
  
  if (/\.(m3u8|mpd)$/i.test(parsed.pathname)) return null;

  
  const customerMatch = host.match(CF_CUSTOMER_HOST_RE);
  if (customerMatch) {
    const code = customerMatch[1];
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    if (id && CF_ID_RE.test(id)) {
      return {
        provider: 'cloudflare-stream',
        type: 'hls',
        id,
        src: `https://customer-${code}.cloudflarestream.com/${id}/manifest/video.m3u8`,
        stability: 'stable',
      };
    }
  }

  
  if (!CF_SHORT_HOST_RE.test(host)) return null;

  const id = parsed.pathname.split('/').filter(Boolean)[0];
  if (!id || !CF_ID_RE.test(id)) return null;

  return {
    provider: 'cloudflare-stream',
    type: 'iframe',
    id,
    embedUrl: `https://iframe.cloudflarestream.com/${id}`,
    stability: 'stable',
  };
}
