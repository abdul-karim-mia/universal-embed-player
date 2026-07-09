// Iframely fallback resolution — deliberately NOT part of the synchronous
// resolver registry (src/resolvers/*, rules.md §2: pure functions, no DOM,
// no network calls). Iframely (iframely.com) is a paid third-party
// "any URL → embed" API; plan.md §0.1 already rejected depending on it for
// the *core* resolver set (a live network round-trip to a third party
// contradicts the client-side-only, no-server premise the rest of this
// package is built on). This file exists purely as an opt-in last resort:
// only invoked by controller.js when every built-in resolver has already
// returned null, and only when a developer supplies their own Iframely key
// via `PlayerOptions.iframelyKey` — no Iframely credentials are ever
// bundled here (rules.md §7.3).
//
// Endpoint, param names, and security guidance verified directly against
// Iframely's own current docs (iframely.com/docs/iframely-api,
// iframely.com/docs/allow-origins), not guessed:
// - The CLIENT-SIDE (browser) endpoint is `iframely.net/api/iframely` — a
//   *different* host from the server-side `iframe.ly/api/iframely`
//   endpoint. Using the wrong one is a real, documented footgun.
// - `key` must be the MD5 hash of the real private API key (Iframely calls
//   this the "client key"); the raw private key must never leave a server.
//   That distinction is the calling developer's responsibility — this
//   function just forwards whatever string it's given as `key=`.
// - `iframe=1&omit_script=1` requests a response whose `html` is (or
//   degrades to) a plain iframe embed with no `<script>` tags, so there is
//   nothing here that ever needs to execute third-party script markup.
const ENDPOINT = 'https://iframely.net/api/iframely';

// Security boundary (rules.md §7.1): only ever mount an iframe pointed at a
// host Iframely itself serves embeds from — never trust an arbitrary src
// string pulled out of a third-party JSON payload without validating it.
const ALLOWED_EMBED_HOST_RE = /(^|\.)iframely\.net$/;

function extractIframeSrc(html) {
  if (typeof document === 'undefined' || !html) return null;
  // <template> content is inert (never parsed as live DOM, scripts inside
  // never execute) — the only safe way to pick apart untrusted remote HTML
  // without using innerHTML on anything the page actually renders
  // (rules.md §7.2/§11).
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
    // No protocol adapter exists for a generic third-party embed whose
    // actual underlying provider we don't know — same controllable:false
    // fallback as Cloudflare Stream (iframe.js). Marked experimental,
    // matching the fragility conventions for every other best-effort,
    // network-dependent resolution path (plan.md §8, rules.md §5).
    stability: 'experimental',
  };
}
