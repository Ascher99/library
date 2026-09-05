import { initTheme, applyTheme } from '../theme.js';

export class ThemeSwitcher {
  /**
   * @param {HTMLElement} container The theme switcher container element
   */
  constructor(container) {
    if (!container) {
      throw new Error('ThemeSwitcher container element is required');
    }
    this.container = container;
    this.buttons = this.container.querySelectorAll('.theme-btn');
    
    this.init();
  }

  init() {
    // Set up click handlers for theme buttons
    this.buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        applyTheme(theme);
      });
    });

    // Initialize the active theme
    initTheme();
  }
}
