export class SearchBar {
  /**
   * @param {Object} elements Group of search DOM elements
   * @param {HTMLInputElement} elements.input The search input element
   * @param {HTMLButtonElement} elements.clearBtn The clear search button
   * @param {HTMLButtonElement} elements.searchBtn The search trigger button
   * @param {Object} options Configuration options
   * @param {Function} options.onSearch Callback triggered when a search is requested
   * @param {number} [options.debounceDelay=500] Delay for debounced input typing
   */
  constructor({ input, clearBtn, searchBtn }, { onSearch, debounceDelay = 500 }) {
    this.input = input;
    this.clearBtn = clearBtn;
    this.searchBtn = searchBtn;
    this.onSearch = onSearch;
    this.debounceDelay = debounceDelay;
    
    this.debounceTimeoutId = null;
    
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Main search button click
    this.searchBtn.addEventListener('click', () => {
      this.cancelPendingSearch();
      this.triggerSearch();
    });

    // Typing in the input (debounced search)
    this.input.addEventListener('input', (e) => {
      const value = e.target.value;
      this.toggleClearButton(value);
      this.cancelPendingSearch();

      this.debounceTimeoutId = setTimeout(() => {
        this.triggerSearch();
      }, this.debounceDelay);
    });

    // Clear search button click
    this.clearBtn.addEventListener('click', () => {
      this.clear();
    });

    // Enter key press in search box
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.cancelPendingSearch();
        this.triggerSearch();
      }
    });
  }

  triggerSearch() {
    if (this.onSearch) {
      this.onSearch(this.input.value);
    }
  }

  cancelPendingSearch() {
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
      this.debounceTimeoutId = null;
    }
  }

  toggleClearButton(value) {
    this.clearBtn.hidden = !value;
  }

  clear() {
    this.cancelPendingSearch();
    this.input.value = '';
    this.toggleClearButton('');
    this.triggerSearch();
  }

  setQuery(query) {
    this.input.value = query;
    this.toggleClearButton(query);
  }
}
