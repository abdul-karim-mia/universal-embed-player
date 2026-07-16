




/**
 * Boolean attributes on <uep-player> use an opt-out convention — "true
 * unless explicitly the string 'false'" — matching `options.shield !== false`
 * / `options.controls !== false` already in core/controller.js, NOT the
 * standard HTML boolean-presence convention (`<video controls>`: any
 * presence = true, absence = false).
 *
 * This isn't just for internal consistency: it's the only convention that's
 * correct under naive attribute stringification. A framework binding like
 * Angular's `[attr.controls]="x"` calls `setAttribute('controls', String(x))`
 * — when `x` is `false`, that produces the literal attribute
 * `controls="false"`. Under the presence convention that reads as "present,
 * therefore true," silently inverting the binding's intent. Under this
 * convention it reads correctly.
 *
 * @param {string | null} attrValue
 * @param {boolean} defaultWhenAbsent - used only when the attribute is entirely absent
 * @returns {boolean}
 */
export function parseUepBoolean(attrValue, defaultWhenAbsent) {
  if (attrValue === null) return defaultWhenAbsent;
  return attrValue !== 'false';
}

/**
 * @param {string | null} attrValue
 * @param {number | undefined} fallback
 * @returns {number | undefined}
 */
export function parseUepNumber(attrValue, fallback) {
  if (attrValue === null) return fallback;
  const parsed = Number(attrValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Parses a JSON-string attribute (used for `theme`, `seo`, and the
 * JSON-array form of `playback-rates`). Invalid JSON degrades to `undefined`
 * with a console.warn rather than throwing — matches the graceful tone of
 * `core/seo.js`'s "skipped" warning and `core/events.js`'s unknown-type warning.
 *
 * @param {string | null} attrValue
 * @param {string} warnLabel - attribute name, used only in the warning message
 * @returns {unknown | undefined}
 */
export function parseUepJson(attrValue, warnLabel) {
  if (attrValue === null) return undefined;
  try {
    return JSON.parse(attrValue);
  } catch {
    console.warn(`[uep] invalid JSON in "${warnLabel}" attribute — ignored`);
    return undefined;
  }
}

/**
 * `playback-rates` accepts either a comma-separated list ("0.5,1,1.5,2")
 * or a JSON array string ("[0.5,1,1.5,2]") — the former is the more natural
 * plain-HTML authoring shape, the latter matches theme/seo's JSON convention.
 *
 * @param {string | null} attrValue
 * @returns {number[] | undefined}
 */
export function parsePlaybackRatesAttr(attrValue) {
  if (attrValue === null) return undefined;
  const trimmed = attrValue.trim();
  if (trimmed.startsWith('[')) {
    const parsed = parseUepJson(trimmed, 'playback-rates');
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number' && Number.isFinite(n)) : undefined;
  }
  const rates = trimmed
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return rates.length > 0 ? rates : undefined;
}
