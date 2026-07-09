// Opt-in, per-provider corner-branding mask (plan.md §7.3). OFF BY DEFAULT:
// visually covering a provider's persistent attribution mark can violate
// that provider's embed Terms of Service — enabling this means you've
// reviewed and accepted that risk for your own use of the provider below.
//
// Currently scoped to YouTube's bottom-right watermark. Confirmed via live
// testing (not guessed) that it persists during active playback even with
// every legitimate brand-minimization param applied (controls=0,
// modestbranding=1, rel=0, iv_load_policy=3, cc_load_policy=1, showinfo=0) —
// this is YouTube's own non-removable branding floor, not something an
// embed parameter can suppress. The mask is a plain opaque div, not an
// attempt to reach into the iframe's DOM (impossible — same-origin policy).
const MASK_REGIONS = {
  youtube: { bottom: '0', right: '0', width: '95px', height: '30px' },
};

/**
 * @param {HTMLElement} container
 * @param {string} provider
 * @returns {{ destroy: () => void } | null}
 */
export function createBrandMask(container, provider) {
  const region = MASK_REGIONS[provider];
  if (!region) return null;

  const mask = document.createElement('div');
  mask.setAttribute('data-uep-brand-mask', '');
  Object.assign(mask.style, {
    position: 'absolute',
    bottom: region.bottom,
    right: region.right,
    width: region.width,
    height: region.height,
    background: 'var(--uep-mask-color, #000)',
    pointerEvents: 'none',
  });

  container.append(mask);

  return { destroy: () => mask.remove() };
}
