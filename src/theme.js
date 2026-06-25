const THEME_STORAGE_KEY = 'the_library_theme';
const VALID_THEMES = ['dark', 'light', 'sepia'];

/**
 * Initializes the theme state on page load.
 * Retrieves from localStorage or defaults to 'sepia'.
 * @returns {string} The active theme name
 */
export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const activeTheme = VALID_THEMES.includes(savedTheme) ? savedTheme : 'sepia';
  applyTheme(activeTheme);
  return activeTheme;
}

/**
 * Applies a specific theme class to the HTML document element.
 * Persists the choice to localStorage and synchronizes button active states.
 * @param {string} theme The theme to apply ('dark', 'light', 'sepia')
 */
export function applyTheme(theme) {
  if (!VALID_THEMES.includes(theme)) return;

  // Remove existing theme classes and add new one
  VALID_THEMES.forEach(t => {
    document.documentElement.classList.remove(`theme-${t}`);
  });
  document.documentElement.classList.add(`theme-${theme}`);

  // Persist state
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // Sync header button states
  const buttons = document.querySelectorAll('.theme-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-theme') === theme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
