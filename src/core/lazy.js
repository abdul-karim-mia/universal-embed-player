// Thumbnail-first ("light") mode: renders a poster image + play button and
// defers all engine mounting (and therefore any third-party script loading)
// until the user actually interacts — the same pattern `lite-youtube-embed`
// uses, adopted directly after reading its source (plan.md §0.1 / §9).
const PROVIDER_POSTERS = {
  youtube: (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
};

function posterUrlFor(resolved) {
  return PROVIDER_POSTERS[resolved.provider]?.(resolved.id) ?? null;
}

export function createLightPoster(container, resolved, options, onActivate) {
  const poster = document.createElement('div');
  poster.setAttribute('data-uep-poster', '');

  const image = typeof options.light === 'string' ? options.light : posterUrlFor(resolved);

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
    width: '68px',
    height: '48px',
    background: 'var(--uep-primary-color, #ff0000)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  });
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
