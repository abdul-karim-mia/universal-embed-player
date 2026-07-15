// Loading/buffering spinner overlay. Mounted for every engine (unlike
// shield/controls/center-play, it is not gated on `engine.controllable` —
// 'ready' and 'buffering' fire regardless of whether we have a command
// bridge into the underlying player) so even brand-locked iframe embeds
// (Vimeo's 'bufferstart', YouTube's state 3) get a consistent loading
// indicator instead of a blank/frozen frame.
let _spinnerStyleInjected = false;
function ensureSpinnerStyles() {
  if (_spinnerStyleInjected || typeof document === 'undefined') return;
  _spinnerStyleInjected = true;
  const s = document.createElement('style');
  s.id = 'uep-spinner-styles';
  s.textContent = `
    @keyframes uep-spinner-spin {
      to { transform: rotate(360deg); }
    }
    [data-uep-spinner] {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 44px;
      height: 44px;
      margin: -22px 0 0 -22px;
      box-sizing: border-box;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.25);
      border-top-color: var(--uep-primary-color, #6d5efc);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
    [data-uep-spinner][data-visible] {
      opacity: 1;
      animation: uep-spinner-spin 0.8s linear infinite;
    }
  `;
  document.head.appendChild(s);
}

export function createSpinner(container, emitter) {
  ensureSpinnerStyles();

  const el = document.createElement('div');
  el.setAttribute('data-uep-spinner', '');
  el.setAttribute('aria-hidden', 'true');

  let visible = false;
  const show = () => {
    if (visible) return;
    visible = true;
    el.setAttribute('data-visible', '');
  };
  const hide = () => {
    if (!visible) return;
    visible = false;
    el.removeAttribute('data-visible');
  };

  // 'buffering' only fires on the *start* of a stall (rules.md / plan.md §5 —
  // no distinct provider-agnostic "resumed" counterpart exists), so hiding
  // relies on whichever unified event fires next once playback is actually
  // moving again: 'timeupdate' (native progress) or 'play' (resumed after a
  // stall-while-playing). 'pause'/'ended'/'error' also clear it so a stall
  // that ends in one of those states doesn't leave the spinner stuck.
  const unsubscribers = [
    emitter.on('buffering', show),
    emitter.on('ready', hide),
    emitter.on('play', hide),
    emitter.on('pause', hide),
    emitter.on('timeupdate', hide),
    emitter.on('ended', hide),
    emitter.on('error', hide),
  ];

  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  container.append(el);

  return {
    show,
    hide,
    destroy: () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
      el.remove();
    },
  };
}
