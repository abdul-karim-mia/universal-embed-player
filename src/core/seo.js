// Optional VideoObject JSON-LD support (schema.org). Pure/side-effect-free by
// design so it can run identically during React/Vue SSR (no DOM, no network)
// and in the vanilla controller's client-side injection path.
//
// Google's own minimum for rich-result eligibility is `name` + `description`
// + `thumbnailUrl` + `uploadDate` together (developers.google.com/search/docs
// /appearance/structured-data/video) — supplying only some of these still
// produces valid JSON-LD, just not one Google will act on. `name` is treated
// as the hard requirement here since a VideoObject with no title isn't
// meaningfully structured data at all; everything else is best-effort.
function secondsToIso8601Duration(totalSeconds) {
  if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds) || totalSeconds < 0) return undefined;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  let out = 'PT';
  if (hours) out += `${hours}H`;
  if (minutes) out += `${minutes}M`;
  if (seconds || (!hours && !minutes)) out += `${seconds}S`;
  return out;
}

/**
 * @param {import('./types.js').ResolvedSource | null} resolved
 * @param {string} url - original input URL, used as a last-resort contentUrl/embedUrl
 * @param {import('./types.js').SeoMetadata} [seo]
 * @returns {Record<string, unknown> | null} null when `seo.name` is missing — nothing worth emitting
 */
export function buildVideoObjectJsonLd(resolved, url, seo) {
  if (!seo?.name) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: seo.name,
    description: seo.description ?? seo.name,
    thumbnailUrl: seo.thumbnailUrl ?? resolved?.poster ?? undefined,
    uploadDate: seo.uploadDate,
    duration: secondsToIso8601Duration(seo.durationSeconds),
    contentUrl: resolved?.src,
    embedUrl: resolved?.embedUrl ?? (resolved ? undefined : url),
  };
}

// Escaping every '<' as its unicode codepoint prevents a `</script>` (or any
// tag-like sequence) inside the JSON payload — e.g. a video description —
// from prematurely closing the script element or being mis-parsed as HTML.
// Standard technique for inline JSON-LD (same one Next.js/Nuxt use).
export function stringifyForScriptTag(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
