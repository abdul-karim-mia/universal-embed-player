









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





export function stringifyForScriptTag(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
