// Writes the developer-supplied theme object as CSS custom properties on the
// player's mount container (rules.md §6). Custom properties pierce Shadow DOM
// boundaries by design, so setting them here is enough for the Shadow-DOM
// control bar (ui/controls.js) to pick them up — no re-render needed.
const THEME_VAR_MAP = {
  primaryColor: '--uep-primary-color',
  accentColor: '--uep-accent-color',
  fontFamily: '--uep-font-family',
};

export function applyTheme(container, theme = {}) {
  for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
    if (theme[key]) container.style.setProperty(cssVar, theme[key]);
  }
}
