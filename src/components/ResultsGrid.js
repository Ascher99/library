import { BookCard } from './BookCard.js';
import { debounce } from '../utils.js';

export class ResultsGrid {
  /**
   * @param {Object} elements DOM elements
   * @param {HTMLElement} elements.grid The grid container element
   * @param {HTMLElement} elements.statusContainer Container for showing search status
   * @param {HTMLElement} elements.statusSpinner Spinner element
   * @param {HTMLElement} elements.statusText Text status label
   * @param {HTMLElement} elements.filterBar Bar container for filters
   * @param {HTMLInputElement} elements.filterInput Filter input element
   * @param {Object} callbacks Event callbacks
   * @param {Function} callbacks.onToggleFavorite Triggered when a book's favorite state is toggled
   * @param {Function} callbacks.isFavorite Check if a book ID is a favorite
   * @param {Function} callbacks.getFavoriteById Get favorite book details
   * @param {Function} callbacks.onSelectBook Triggered when a book card is clicked
   */
  constructor(
    { grid, statusContainer, statusSpinner, statusText, filterBar, filterInput },
    { onToggleFavorite, isFavorite, getFavoriteById, onSelectBook }
  ) {
    this.grid = grid;
    this.statusContainer = statusContainer;
    this.statusSpinner = statusSpinner;
    this.statusText = statusText;
    this.filterBar = filterBar;
    this.filterInput = filterInput;

    this.onToggleFavorite = onToggleFavorite;
    this.isFavorite = isFavorite;
    this.getFavoriteById = getFavoriteById;
    this.onSelectBook = onSelectBook;

    this.searchResults = [];
    this.authorFilter = '';
    this.cardInstances = []; // Cache BookCard instances for quick state updates

    this.init();
  }

  init() {
    const handleFilterInput = debounce((e) => {
      this.authorFilter = e.target.value;
      this.render();
    }, 150);

    this.filterInput.addEventListener('input', handleFilterInput);
  }

  /**
   * Updates the search results and resets filters.
   * @param {Array} books Array of book documents
   */
  updateResults(books) {
    this.searchResults = books;
    this.authorFilter = '';
    this.filterInput.value = '';
    
    if (books.length > 0) {
      this.filterBar.hidden = false;
      this.statusContainer.hidden = true;
    } else {
      this.filterBar.hidden = true;
    }

    this.render();
  }

  /**
   * Clears results and hides filter bar.
   */
  clear() {
    this.searchResults = [];
    this.authorFilter = '';
    this.filterInput.value = '';
    this.filterBar.hidden = true;
    this.grid.innerHTML = '';
  }

  /**
   * Displays status messages (Loading, Empty, Not Found, Error)
   * @param {string} state The status code
   * @param {string} query The related search query
   */
  showStatus(state, query = '') {
    this.clear();
    this.statusContainer.hidden = false;
    this.statusSpinner.hidden = true;

    switch (state) {
      case 'LOADING':
        this.statusSpinner.hidden = false;
        this.statusText.textContent = `Searching for books matching "${query}"...`;
        break;
      case 'EMPTY_INPUT':
        this.statusText.textContent = 'Enter a query above to start searching for books.';
        break;
      case 'NOTHING_FOUND':
        this.statusText.textContent = `No books found matching "${query}". Try searching for something else.`;
        break;
      case 'NETWORK_ERROR':
        this.statusText.textContent = 'Network error. Please check your internet connection and try again.';
        break;
      default:
        this.statusText.textContent = 'An unexpected error occurred. Please try again.';
        break;
    }
  }

  /**
   * Renders the current list of books filtered by author.
   */
  render() {
    this.grid.innerHTML = '';
    this.cardInstances = [];

    let filteredDocs = this.searchResults;
    if (this.authorFilter.trim()) {
      const authorQuery = this.authorFilter.toLowerCase().trim();
      filteredDocs = this.searchResults.filter(book =>
        book.authors.some(author => author.toLowerCase().includes(authorQuery))
      );
    }

    if (filteredDocs.length === 0 && this.searchResults.length > 0) {
      this.grid.innerHTML = `
        <div class="card status-box" style="grid-column: 1 / -1; padding: 40px;">
          <p style="color: var(--text-secondary); font-weight: 500;">
            No search results match author filter "${this.authorFilter}".
          </p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    filteredDocs.forEach(book => {
      const isSaved = this.isFavorite(book.id);
      const savedBook = isSaved && this.getFavoriteById ? this.getFavoriteById(book.id) : null;
      const displayBook = savedBook || book;

      const cardInstance = new BookCard(displayBook, isSaved, {
        onToggleFavorite: this.onToggleFavorite,
        onSelectBook: this.onSelectBook
      });
      
      fragment.appendChild(cardInstance.render());
      this.cardInstances.push(cardInstance);
    });
    this.grid.appendChild(fragment);
  }

  /**
   * Syncs favorite status across all rendered BookCards
   */
  syncCardStates() {
    this.render();
  }
}

