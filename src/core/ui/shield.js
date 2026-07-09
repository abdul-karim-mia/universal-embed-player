// Transparent overlay mounted above an iframe engine's media surface.
// Forwards clicks to the engine's own play/pause command instead of letting
// the click reach the provider's native chrome underneath. Only mounted by
// the controller when `engine.controllable` is true (rules.md §4.5) — for
// providers with no postMessage protocol adapter, the shield is skipped so
// users always retain a working control surface.
export function createShield(container, engine) {
  const shield = document.createElement('div');
  shield.setAttribute('data-uep-shield', '');
  Object.assign(shield.style, {
    position: 'absolute',
    inset: '0',
    background: 'transparent',
    cursor: 'pointer',
  });

  let isPlaying = false;

  const onClick = () => {
    if (isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  };
  const onContextMenu = (event) => event.preventDefault();

  shield.addEventListener('click', onClick);
  shield.addEventListener('contextmenu', onContextMenu);

  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  container.append(shield);

  return {
    setPlaying: (playing) => {
      isPlaying = playing;
    },
    destroy: () => {
      shield.removeEventListener('click', onClick);
      shield.removeEventListener('contextmenu', onContextMenu);
      shield.remove();
    },
  };
}
