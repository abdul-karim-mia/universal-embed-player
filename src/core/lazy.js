// Thumbnail-first ("light") mode: renders a poster image + play button and
// defers all engine mounting (and therefore any third-party script loading)
// until the user actually interacts — the same pattern `lite-youtube-embed`
// uses, adopted directly after reading its source (plan.md §0.1 / §9).
//
// `light` (boolean) toggles this mode on/off; `poster` (string) is an
// independent option for the image itself. If `poster` is omitted, we fall
// back to a provider default where one exists as a predictable, deterministic
// URL (YouTube, Dailymotion) — providers without one (Vimeo's thumbnails are
// hash-based and require an API call, not derivable from the ID alone; most
// professional-hosting/cloud-storage providers have no public thumbnail
// endpoint at all) just show a plain background rather than a guessed URL.
const PROVIDER_POSTERS = {
  youtube: (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  dailymotion: (id) => `https://www.dailymotion.com/thumbnail/video/${id}`,
};

function posterUrlFor(resolved) {
  return PROVIDER_POSTERS[resolved.provider]?.(resolved.id) ?? null;
}

export function createLightPoster(container, resolved, options, onActivate) {
  const poster = document.createElement('div');
  poster.setAttribute('data-uep-poster', '');

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
    poster.remove();
    onActivate();
  };
  poster.addEventListener('click', activate, { once: true });

  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  container.append(poster);

  return { destroy: () => poster.remove() };
}
