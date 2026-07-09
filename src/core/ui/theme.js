// Writes the developer-supplied theme object as CSS custom properties on the
// player's mount container (rules.md §6). Custom properties pierce Shadow DOM
// boundaries by design, so setting them here is enough for the Shadow-DOM
// control bar (ui/controls.js) to pick them up — no re-render needed.
//
// Three groups of variables:
//   • Identity  – primaryColor, accentColor, fontFamily
//   • Bar shape – barBackground, barRadius, barBlur, barPadding, barMargin
//   • Elements  – popupBackground, buttonSize, sliderHeight, timeFontSize
const THEME_VAR_MAP = {
  // Identity
  primaryColor:    '--uep-primary-color',
  accentColor:     '--uep-accent-color',
  fontFamily:      '--uep-font-family',
  // Control bar shape
  barBackground:   '--uep-bar-bg',
  barRadius:       '--uep-bar-radius',
  barBlur:         '--uep-bar-blur',
  barPadding:      '--uep-bar-padding',
  barMargin:       '--uep-bar-margin',
  // Element dimensions / typography
  buttonSize:      '--uep-btn-size',
  sliderHeight:    '--uep-slider-height',
  timeFontSize:    '--uep-time-size',
};

export function applyTheme(container, theme = {}) {
  for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
    if (theme[key]) container.style.setProperty(cssVar, theme[key]);
  }
}
