// Embed parameter reference: https://knowledge.kaltura.com (extwidget/preview
// iframe pattern, confirmed against Kaltura's own published example URL:
// kaltura.com/index.php/extwidget/preview/partner_id/<pid>/uiconf_id/<uid>/entry_id/<eid>/embed/iframe).
// Path segments are key/value pairs rather than a single fixed regex, so this
// resolver walks the path looking for the three required keys instead of
// hardcoding their order.
const KALTURA_HOST_RE = /(^|\.)kaltura\.com$/;
const PARTNER_ID_RE = /^\d+$/;
const UICONF_ID_RE = /^\d+$/;
const ENTRY_ID_RE = /^[\w]+$/;

function readPathParam(segments, key) {
  const index = segments.indexOf(key);
  return index === -1 ? null : (segments[index + 1] ?? null);
}

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

  if (!KALTURA_HOST_RE.test(parsed.hostname)) return null;
  if (!parsed.pathname.includes('/extwidget/')) return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  const partnerId = readPathParam(segments, 'partner_id');
  const uiconfId = readPathParam(segments, 'uiconf_id');
  const entryId = readPathParam(segments, 'entry_id');

  if (!partnerId || !uiconfId || !entryId) return null;
  if (!PARTNER_ID_RE.test(partnerId) || !UICONF_ID_RE.test(uiconfId) || !ENTRY_ID_RE.test(entryId)) {
    return null;
  }

  return {
    provider: 'kaltura',
    type: 'iframe',
    id: entryId,
    embedUrl: `https://www.kaltura.com/index.php/extwidget/preview/partner_id/${partnerId}/uiconf_id/${uiconfId}/entry_id/${entryId}/embed/iframe`,
    stability: 'stable',
  };
}
