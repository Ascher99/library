// Import styling so Vite bundles and injects it
import './style.css';

import { searchBooks } from './api.js';
import { getFavorites, addFavorite, removeFavorite, isFavorite, getFavoriteById, updateFavoriteMeta } from './favorites.js';

import { ThemeSwitcher } from './components/ThemeSwitcher.js';
import { SearchBar } from './components/SearchBar.js';
import { ResultsGrid } from './components/ResultsGrid.js';
import { FavoritesDrawer } from './components/FavoritesDrawer.js';
import { BookModal } from './components/BookModal.js';

// ==========================================================================
// Application Components & Orchestration
// ==========================================================================
let searchBar = null;
let resultsGrid = null;
let favoritesDrawer = null;
let themeSwitcher = null;
let bookModal = null;

async function performSearch(query) {
  const queryText = query ? query.trim() : '';
  
  if (!queryText) {
    resultsGrid.showStatus('EMPTY_INPUT');
    return;
  }

  resultsGrid.showStatus('LOADING', queryText);

  try {
    const books = await searchBooks(queryText);
    
    // If request was aborted internally, books will be null
    if (books === null) return;

    resultsGrid.updateResults(books);
  } catch (error) {
    resultsGrid.showStatus(error.message, queryText);
  }
}

// ==========================================================================
// Initialization
// ==========================================================================
function init() {
  // 1. Initialize Theme Switcher Component
  const themeSwitcherEl = document.querySelector('.theme-switcher');
  if (themeSwitcherEl) {
    themeSwitcher = new ThemeSwitcher(themeSwitcherEl);
  }

  // 2. Initialize Book Modal Component
  bookModal = new BookModal({
    isFavorite: (id) => isFavorite(id),
    getFavoriteById: (id) => getFavoriteById(id),
    onToggleFavorite: (book) => {
      if (isFavorite(book.id)) {
        removeFavorite(book.id);
      } else {
        addFavorite(book);
      }
      favoritesDrawer.updateFavorites(getFavorites());
      resultsGrid.syncCardStates();
    },
    onUpdateMeta: (bookId, meta) => {
      updateFavoriteMeta(bookId, meta);
      favoritesDrawer.updateFavorites(getFavorites());
      resultsGrid.syncCardStates();
    }
  });

  // 3. Initialize Search Bar Component
  searchBar = new SearchBar(
    {
      input: document.getElementById('search-input'),
      clearBtn: document.getElementById('clear-search-btn'),
      searchBtn: document.getElementById('search-btn')
    },
    {
      onSearch: (query) => performSearch(query),
      debounceDelay: 500
    }
  );

  // 4. Initialize Results Grid Component
  resultsGrid = new ResultsGrid(
    {
      grid: document.getElementById('results-grid'),
      statusContainer: document.getElementById('status-container'),
      statusSpinner: document.getElementById('status-spinner'),
      statusText: document.getElementById('status-text'),
      filterBar: document.getElementById('search-filters-bar'),
      filterInput: document.getElementById('filter-input'),
      sortSelect: document.getElementById('sort-select')
    },
    {
      isFavorite: (id) => isFavorite(id),
      getFavoriteById: (id) => getFavoriteById(id),
      onToggleFavorite: (book) => {
        if (isFavorite(book.id)) {
          removeFavorite(book.id);
        } else {
          addFavorite(book);
        }
        favoritesDrawer.updateFavorites(getFavorites());
        resultsGrid.syncCardStates();
      },
      onSelectBook: (book) => {
        bookModal.open(book);
      }
    }
  );

  // 5. Initialize Favorites Drawer Component
  favoritesDrawer = new FavoritesDrawer(
    {
      section: document.getElementById('favorites-section'),
      badgeSubtitle: document.getElementById('favorites-badge-subtitle'),
      fabBadge: document.getElementById('fab-badge'),
      closeBtn: document.getElementById('close-favs-btn'),
      toggleFab: document.getElementById('toggle-favs-fab'),
      filterContainer: document.getElementById('favorites-filter-container'),
      filterInput: document.getElementById('favorites-filter-input'),
      statusTabsContainer: document.getElementById('favorites-status-tabs'),
      statsBar: document.getElementById('favorites-stats-bar'),
      readingGoalWidget: document.getElementById('reading-goal-widget'),
      emptyMsg: document.getElementById('favorites-empty-msg'),
      list: document.getElementById('favorites-list'),
      exportBtn: document.getElementById('export-favs-btn'),
      importBtn: document.getElementById('import-favs-btn'),
      importInput: document.getElementById('import-favs-input'),
      toastContainer: document.getElementById('favorites-toast')
    },
    {
      onRemoveFavorite: (bookId) => {
        removeFavorite(bookId);
        favoritesDrawer.updateFavorites(getFavorites());
        resultsGrid.syncCardStates();
      },
      onSelectBook: (book) => {
        bookModal.open(book);
      },
      onImportSuccess: () => {
        favoritesDrawer.updateFavorites(getFavorites());
        resultsGrid.syncCardStates();
      }
    }
  );

  // 6. Initialize Genre Quick Topic Chips
  const genreChipsContainer = document.getElementById('genre-chips');
  if (genreChipsContainer) {
    genreChipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.genre-chip');
      if (!chip) return;
      const query = chip.getAttribute('data-query');
      if (query) {
        genreChipsContainer.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        searchBar.setQuery(query);
        performSearch(query);
      }
    });
  }

  // Load initial favorites list from LocalStorage
  favoritesDrawer.updateFavorites(getFavorites());
}

// Execute app startup
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}

