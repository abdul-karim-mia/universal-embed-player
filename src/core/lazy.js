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

function posterUrlFor(resolved) {
  return PROVIDER_POSTERS[resolved.provider]?.(resolved.id) ?? null;
}

export function createLightPoster(container, resolved, options, onActivate) {
  const poster = document.createElement('div');
  poster.setAttribute('data-uep-poster', '');

  let destroyed = false;
  const image = options.poster ?? posterUrlFor(resolved);

  Object.assign(poster.style, {
    position: 'absolute',
    inset: '0',
    backgroundColor: '#000',
    backgroundImage: image ? `url("${image}")` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    cursor: 'pointer',
  });

  if (!image && resolved.id && ASYNC_PROVIDER_POSTERS[resolved.provider]) {
    ASYNC_PROVIDER_POSTERS[resolved.provider](resolved.id)
      .then((url) => {
        // Guard against the poster having already been clicked away (or the
        // player destroyed) before the oEmbed round trip resolved.
        if (destroyed || !url) return;
        poster.style.backgroundImage = `url("${url}")`;
      })
      .catch(() => {
        // Best-effort only (plan.md §8-style fragility) — plain background
        // stays if the oEmbed fetch fails (offline, CORS, rate-limited, CSP).
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
