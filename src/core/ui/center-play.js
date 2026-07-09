const ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" style="width: 32px; height: 32px; margin-left: 3px;"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" style="width: 32px; height: 32px;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
};

export function createCenterPlayButton(container, engine, emitter, options) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-uep-center-play', '');
  btn.setAttribute('aria-label', 'Play');
  btn.innerHTML = ICONS.play;

  Object.assign(btn.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scale(1)',
    width: '64px',
    height: '64px',
    background: 'var(--uep-primary-color, #6d5efc)',
    color: 'var(--uep-accent-color, #ffffff)',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
    transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s ease',
    opacity: '1',
    zIndex: '3',
  });

  let isPlaying = false;

  // Hover states: scale up slightly
  const onMouseEnter = () => {
    btn.style.transform = isPlaying
      ? 'translate(-50%, -50%) scale(0.8)'
      : 'translate(-50%, -50%) scale(1.08)';
    btn.style.backgroundColor = 'var(--uep-primary-hover-color, #7e71ff)';
  };
  const onMouseLeave = () => {
    btn.style.transform = isPlaying
      ? 'translate(-50%, -50%) scale(0.8)'
      : 'translate(-50%, -50%) scale(1)';
    btn.style.backgroundColor = 'var(--uep-primary-color, #6d5efc)';
  };

  btn.addEventListener('mouseenter', onMouseEnter);
  btn.addEventListener('mouseleave', onMouseLeave);

  const updateState = (playing) => {
    isPlaying = playing;
    btn.innerHTML = playing ? ICONS.pause : ICONS.play;
    btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    if (playing) {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
      btn.style.transform = 'translate(-50%, -50%) scale(0.8)';
    } else {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      btn.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  };

  const onClick = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  };

  btn.addEventListener('click', onClick);

  const unsubscribers = [
    emitter.on('play', () => updateState(true)),
    emitter.on('pause', () => updateState(false)),
  ];

  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  container.append(btn);

  return {
    destroy: () => {
      btn.removeEventListener('click', onClick);
      btn.removeEventListener('mouseenter', onMouseEnter);
      btn.removeEventListener('mouseleave', onMouseLeave);
      for (const unsub of unsubscribers) unsub();
      btn.remove();
    },
  };
}
