
























const ENDPOINT = 'https://iframely.net/api/iframely';




const ALLOWED_EMBED_HOST_RE = /(^|\.)iframely\.net$/;

function extractIframeSrc(html) {
  if (typeof document === 'undefined' || !html) return null;
  
  
  
  
  const template = document.createElement('template');
  template.innerHTML = html;
  const iframe = template.content.querySelector('iframe');
  return iframe?.getAttribute('src') ?? null;
}

/**
 * @param {string} url
 * @param {string} key
 * @returns {Promise<import('./types.js').ResolvedSource | null>}
 */
export async function resolveViaIframely(url, key) {
  if (typeof fetch === 'undefined' || !key) return null;

  const endpoint = new URL(ENDPOINT);
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('key', key);
  endpoint.searchParams.set('iframe', '1');
  endpoint.searchParams.set('omit_script', '1');

  let response;
  try {
    response = await fetch(endpoint.toString());
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let data;
  try {
    data = await response.json();
  } catch {
    return null;
  }

  const iframeSrc = extractIframeSrc(data?.html);
  if (!iframeSrc) return null;

  let parsedSrc;
  try {
    parsedSrc = new URL(iframeSrc, ENDPOINT);
  } catch {
    return null;
  }
  if (!ALLOWED_EMBED_HOST_RE.test(parsedSrc.hostname)) return null;

  return {
    provider: 'iframely',
    type: 'iframe',
    embedUrl: parsedSrc.toString(),
    
    
    
    
    
    stability: 'experimental',
  };
}
