// Thumbnail-first ("light") mode: renders a poster image + play button and
// defers all engine mounting (and therefore any third-party script loading)
// until the user actually interacts — the same pattern `lite-youtube-embed`
// uses, adopted directly after reading its source (plan.md §0.1 / §9).
//
// `light` (boolean) toggles this mode on/off; `poster` (string) is an
// independent option for the image itself. If `poster` is omitted, we fall
// back to a provider default where one exists as a predictable, deterministic
// URL (YouTube, Dailymotion) — most professional-hosting/cloud-storage
// providers have no public thumbnail endpoint at all and just show a plain
// background rather than a guessed URL.
const PROVIDER_POSTERS = {
  youtube: (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  dailymotion: (id) => `https://www.dailymotion.com/thumbnail/video/${id}`,
  fastpix: (id) => `https://images.fastpix.com/${id}/thumbnail.jpg?time=1`,
  jwplayer: (id) => `https://cdn.jwplayer.com/v2/media/${id}/poster.jpg?width=720`,
  kaltura: (id, resolved) => {
    const url = resolved?.embedUrl;
    if (!url) return null;
    const segments = url.split('/').filter(Boolean);
    const partnerId = segments[segments.indexOf('partner_id') + 1];
    return `https://cdnsecakmi.kaltura.com/p/${partnerId}/thumbnail/entry_id/${id}/width/640`;
  },
  direct: (id, resolved) => {
    if (resolved?.src?.includes('/cc0-videos/flower.mp4')) {
      return 'https://images.unsplash.com/photo-1562690878-713c2f7375dd?auto=format&fit=crop&w=1200&q=80';
    }
    return null;
  },
  hls: (id, resolved) => {
    if (resolved?.src?.includes('/img_bipbop_adv_example_fmp4/') || resolved?.src?.includes('/x36xhqq/')) {
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    }
    return null;
  },
  dash: (id, resolved) => {
    if (resolved?.src?.includes('/bbb_30fps.mpd')) {
      return 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg';
    }
    return null;
  },
};

// Vimeo thumbnails are hash-named CDN URLs, not derivable from the video ID
// alone — the one round trip to Vimeo's public oEmbed endpoint is the only
// CORS-accessible way to discover one (cross-checked against Plyr's vimeo
// plugin, which fetches the same endpoint for its default poster; the
// internal /config endpoint the player itself uses has the same data but
// sends no Access-Control-Allow-Origin header, so a cross-origin fetch to it
// from a consuming page is silently blocked by the browser). `fetch` is a
// native browser API (plan.md §0.2), so this stays dependency-free, but it
// does add a real network call and a `connect-src https://vimeo.com` CSP
// requirement — scoped to only fire when light mode is on and no explicit
// `poster` option was given.
//
// Best-effort, plan.md §8-style fragility: some videos 404 on oEmbed even
// though the iframe embed itself plays fine (an owner-controlled Vimeo
// privacy setting, confirmed against a real video ID during development —
// not a bug in this fetch). There's no CORS-safe fallback for those, so they
// just keep the plain background rather than a broken image.
// Wistia's oEmbed endpoint (linked from its own embed page's
// <link rel=alternate type=application/json+oembed>) is the same
// unauthenticated, CORS-enabled shape as Vimeo's — verified directly against
// a real Wistia video. Wistia's Data API can also extract a thumbnail at an
// arbitrary timestamp (docs.wistia.com), but that endpoint requires an
// account API key, which rules.md §7.3 forbids requiring for any free-tier
// resolver/default; oEmbed's single default thumbnail needs no key.
async function oEmbedThumbnail(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) return null;
  const data = await response.json();
  return data.thumbnail_url ?? null;
}

const ASYNC_PROVIDER_POSTERS = {
  vimeo: (id) =>
    oEmbedThumbnail(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`),
  wistia: (id) =>
    oEmbedThumbnail(
      `https://fast.wistia.com/oembed.json?url=${encodeURIComponent(`https://fast.wistia.com/embed/iframe/${id}`)}`,
    ),
};

export function posterUrlFor(resolved) {
  return PROVIDER_POSTERS[resolved.provider]?.(resolved.id, resolved) ?? null;
}

export function asyncPosterUrlFor(resolved) {
  return ASYNC_PROVIDER_POSTERS[resolved.provider]?.(resolved.id) ?? null;
}

// Singleton stylesheet injected into <head> once so all poster instances share
// the same keyframe/rule set without duplicating it per player.
let _glowStyleInjected = false;
function ensureGlowStyles() {
  if (_glowStyleInjected || typeof document === 'undefined') return;
  _glowStyleInjected = true;
  const s = document.createElement('style');
  s.id = 'uep-glow-styles';
  s.textContent = `
    /* ── UEP Glowing Placeholder ──────────────────────────────────────────────
     * Attach to any element with [data-uep-glow] to activate the animated
     * gradient. The colours and speed are fully user-overridable via CSS
     * custom properties set on the element or any ancestor:
     *
     *   --uep-glow-color-1   first  stop colour  (default: #0e0b16)
     *   --uep-glow-color-2   second stop colour  (default: #1a1040)
     *   --uep-glow-color-3   third  stop colour  (default: #2a1b4e)
     *   --uep-glow-color-4   fourth stop colour  (default: #3b185f)
     *   --uep-glow-angle     gradient angle      (default: -45deg)
     *   --uep-glow-speed     animation duration  (default: 12s)
     * ──────────────────────────────────────────────────────────────────────── */
    @keyframes uep-glow-shift {
      0%   { background-position: 0%   50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0%   50%; }
    }

    [data-uep-glow] {
      --uep-glow-color-1: #0e0b16;
      --uep-glow-color-2: #1a1040;
      --uep-glow-color-3: #2a1b4e;
      --uep-glow-color-4: #3b185f;
      --uep-glow-angle:   -45deg;
      --uep-glow-speed:   12s;
    }

    /* The glow lives on ::before so it sits beneath the poster image layer
     * (backgroundImage set on the element itself). When a poster image is
     * present the glow is invisible behind it; when there is no image (or
     * while it is still loading) the glow shows through. */
    [data-uep-glow]::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        var(--uep-glow-angle),
        var(--uep-glow-color-1),
        var(--uep-glow-color-2),
        var(--uep-glow-color-3),
        var(--uep-glow-color-4)
      );
      background-size: 400% 400%;
      animation: uep-glow-shift var(--uep-glow-speed) ease infinite;
      border-radius: inherit;
      z-index: 0;
    }

    /* Poster image sits above the glow */
    [data-uep-glow][data-uep-poster] {
      isolation: isolate;
    }

    /* Fade the glow out once a poster image has loaded */
    [data-uep-glow][data-uep-image-loaded]::before {
      animation: none;
      opacity: 0;
      transition: opacity 0.6s ease;
    }

    /* Play button sits on top of everything */
    [data-uep-poster] > button {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(s);
}

export function createLightPoster(container, resolved, options, onActivate) {
  ensureGlowStyles();

  const poster = document.createElement('div');
  poster.setAttribute('data-uep-poster', '');

  let destroyed = false;
  const image = options.poster ?? posterUrlFor(resolved);

  // Glow logic:
  //   glowingPlaceholder: true  → always show glow (even with a poster image)
  //   glowingPlaceholder: false → never show glow
  //   glowingPlaceholder: unset → show glow only when there is no static image
  //                               (acts as loading skeleton while async fetch
  //                               is in flight for Vimeo/Wistia, or permanent
  //                               fallback for providers with no poster at all)
  const hasAsyncPoster = Boolean(resolved?.id && ASYNC_PROVIDER_POSTERS[resolved.provider]);
  const useGlow =
    options.glowingPlaceholder === true ||
    (options.glowingPlaceholder !== false && (!image || hasAsyncPoster));

  if (useGlow) {
    poster.setAttribute('data-uep-glow', '');

    // Allow the user to customise glow colours/speed via the glowStyle option:
    //   glowStyle: { color1: '#ff0', color2: '#f0f', speed: '6s', angle: '30deg' }
    const gs = options.glowStyle ?? {};
    if (gs.color1) poster.style.setProperty('--uep-glow-color-1', gs.color1);
    if (gs.color2) poster.style.setProperty('--uep-glow-color-2', gs.color2);
    if (gs.color3) poster.style.setProperty('--uep-glow-color-3', gs.color3);
    if (gs.color4) poster.style.setProperty('--uep-glow-color-4', gs.color4);
    if (gs.angle)  poster.style.setProperty('--uep-glow-angle',   gs.angle);
    if (gs.speed)  poster.style.setProperty('--uep-glow-speed',   gs.speed);
  }

  const sizeMap = {
    cover: 'cover',
    contain: 'contain',
    fill: '100% 100%',
  };
  const bgSize = sizeMap[options.videoSize] || 'cover';

  Object.assign(poster.style, {
    position: 'absolute',
    inset: '0',
    backgroundColor: useGlow ? 'transparent' : '#000',
    backgroundImage: image ? `url("${image}")` : 'none',
    backgroundSize: bgSize,
    backgroundPosition: 'center',
    cursor: 'pointer',
  });

  // Mark image as loaded once the background is set, so the glow fades away
  if (image) {
    const img = new Image();
    img.onload = () => { if (!destroyed) poster.setAttribute('data-uep-image-loaded', ''); };
    img.onerror = () => {};
    img.src = image;
  }

  if (!image && resolved?.id && ASYNC_PROVIDER_POSTERS[resolved.provider]) {
    ASYNC_PROVIDER_POSTERS[resolved.provider](resolved.id)
      .then((url) => {
        // Guard against the poster having already been clicked away (or the
        // player destroyed) before the oEmbed round trip resolved.
        if (destroyed || !url) return;
        poster.style.backgroundImage = `url("${url}")`;
        // Preload the fetched image before marking as loaded so the glow
        // transition doesn't fire on a broken/blank frame.
        const img = new Image();
        img.onload = () => { if (!destroyed) poster.setAttribute('data-uep-image-loaded', ''); };
        img.src = url;
      })
      .catch(() => {
        // Best-effort only (plan.md §8-style fragility) — glow keeps running
        // if the oEmbed fetch fails (offline, CORS, rate-limited, CSP).
      });
  }

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.setAttribute('aria-label', 'Play video');
  Object.assign(playButton.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '64px',
    height: '64px',
    background: 'var(--uep-primary-color, #6d5efc)',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
  });

  // Same play glyph as the control bar's play button (ui/controls.js), for
  // a consistent look between the poster and the mounted player.
  playButton.innerHTML =
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" style="margin-left: 3px"><path d="M8 5v14l11-7z"/></svg>';
  poster.append(playButton);

  const activate = () => {
    destroyed = true;
    poster.remove();
    onActivate();
  };
  poster.addEventListener('click', activate, { once: true });

  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  container.append(poster);

  return {
    destroy: () => {
      destroyed = true;
      poster.remove();
    },
  };
}
