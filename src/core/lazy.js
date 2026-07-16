










const DEFAULT_TARGET_WIDTH = 640;
const MIN_TARGET_WIDTH = 160;
const MAX_TARGET_WIDTH = 1920;







function getTargetWidth(container) {
  if (typeof window === 'undefined') return DEFAULT_TARGET_WIDTH;
  const cssWidth = container.getBoundingClientRect().width || container.offsetWidth || DEFAULT_TARGET_WIDTH;
  const dpr = window.devicePixelRatio || 1;
  return Math.round(Math.min(MAX_TARGET_WIDTH, Math.max(MIN_TARGET_WIDTH, cssWidth * dpr)));
}












const YOUTUBE_THUMB_SIZES = [
  { name: 'mqdefault', width: 320 },
  { name: 'hqdefault', width: 480 },
  { name: 'sddefault', width: 640 },
  { name: 'maxresdefault', width: 1280 },
];

function youtubeThumbName(targetWidth) {
  const fit = YOUTUBE_THUMB_SIZES.find((size) => targetWidth <= size.width);
  return (fit ?? YOUTUBE_THUMB_SIZES[YOUTUBE_THUMB_SIZES.length - 1]).name;
}

const PROVIDER_POSTERS = {
  youtube: (id, resolved, targetWidth) => `https://i.ytimg.com/vi/${id}/${youtubeThumbName(targetWidth)}.jpg`,
  
  
  
  fastpix: (id, resolved, targetWidth) => `https://images.fastpix.com/${id}/thumbnail.jpg?time=1&width=${targetWidth}`,
  jwplayer: (id, resolved, targetWidth) => `https://cdn.jwplayer.com/v2/media/${id}/poster.jpg?width=${targetWidth}`,
  kaltura: (id, resolved, targetWidth) => {
    const url = resolved?.embedUrl;
    if (!url) return null;
    const segments = url.split('/').filter(Boolean);
    const partnerId = segments[segments.indexOf('partner_id') + 1];
    return `https://cdnsecakmi.kaltura.com/p/${partnerId}/thumbnail/entry_id/${id}/width/${targetWidth}`;
  },
  direct: (id, resolved) => {
    if (resolved?.src?.includes('/cc0-videos/flower.mp4')) {
      return 'https://images.unsplash.com/photo-1562690878-713c2f7375dd?auto=format&fit=crop&w=1200&q=80';
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

























async function oEmbedThumbnail(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) return null;
  const data = await response.json();
  return data.thumbnail_url ?? null;
}



const ASYNC_PROVIDER_POSTERS = {
  vimeo: (id, targetWidth) =>
    oEmbedThumbnail(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}&maxwidth=${targetWidth}`,
    ),
  wistia: (id, targetWidth) =>
    oEmbedThumbnail(
      `https://fast.wistia.com/oembed.json?url=${encodeURIComponent(`https://fast.wistia.com/embed/iframe/${id}`)}&maxwidth=${targetWidth}`,
    ),
};

export function posterUrlFor(resolved, targetWidth = DEFAULT_TARGET_WIDTH) {
  return PROVIDER_POSTERS[resolved.provider]?.(resolved.id, resolved, targetWidth) ?? null;
}

export function asyncPosterUrlFor(resolved, targetWidth = DEFAULT_TARGET_WIDTH) {
  return ASYNC_PROVIDER_POSTERS[resolved.provider]?.(resolved.id, targetWidth) ?? null;
}



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
  const targetWidth = getTargetWidth(container);
  const image = options.poster ?? posterUrlFor(resolved, targetWidth);

  
  
  
  
  
  
  
  const hasAsyncPoster = Boolean(resolved?.id && ASYNC_PROVIDER_POSTERS[resolved.provider]);
  const useGlow =
    options.glowingPlaceholder === true ||
    (options.glowingPlaceholder !== false && (!image || hasAsyncPoster));

  if (useGlow) {
    poster.setAttribute('data-uep-glow', '');

    
    
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

  
  if (image) {
    const img = new Image();
    img.onload = () => { if (!destroyed) poster.setAttribute('data-uep-image-loaded', ''); };
    img.onerror = () => {};
    img.src = image;
  }

  if (!image && resolved?.id && ASYNC_PROVIDER_POSTERS[resolved.provider]) {
    ASYNC_PROVIDER_POSTERS[resolved.provider](resolved.id, targetWidth)
      .then((url) => {
        
        
        if (destroyed || !url) return;
        poster.style.backgroundImage = `url("${url}")`;
        
        
        const img = new Image();
        img.onload = () => { if (!destroyed) poster.setAttribute('data-uep-image-loaded', ''); };
        img.src = url;
      })
      .catch(() => {
        
        
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
