








const THEME_VAR_MAP = {
  
  primaryColor:    '--uep-primary-color',
  accentColor:     '--uep-accent-color',
  fontFamily:      '--uep-font-family',
  
  barBackground:   '--uep-bar-bg',
  barRadius:       '--uep-bar-radius',
  barBlur:         '--uep-bar-blur',
  barPadding:      '--uep-bar-padding',
  barMargin:       '--uep-bar-margin',
  
  buttonSize:      '--uep-btn-size',
  sliderHeight:    '--uep-slider-height',
  timeFontSize:    '--uep-time-size',
};

export function applyTheme(container, theme = {}) {
  for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
    if (theme[key]) container.style.setProperty(cssVar, theme[key]);
  }
}
