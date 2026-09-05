// Import styling so Vite bundles and injects it
import './style.css';

import { searchBooks } from './api.js';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from './favorites.js';

import { ThemeSwitcher } from './components/ThemeSwitcher.js';
import { SearchBar } from './components/SearchBar.js';
import { ResultsGrid } from './components/ResultsGrid.js';
import { FavoritesDrawer } from './components/FavoritesDrawer.js';

// ==========================================================================
// Application Components & Orchestration
// ==========================================================================
let searchBar = null;
let resultsGrid = null;
let favoritesDrawer = null;
let themeSwitcher = null;

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

  // 2. Initialize Search Bar Component
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

  // 3. Initialize Results Grid Component
  resultsGrid = new ResultsGrid(
    {
      grid: document.getElementById('results-grid'),
      statusContainer: document.getElementById('status-container'),
      statusSpinner: document.getElementById('status-spinner'),
      statusText: document.getElementById('status-text'),
      filterBar: document.getElementById('search-filters-bar'),
      filterInput: document.getElementById('filter-input')
    },
    {
      isFavorite: (id) => isFavorite(id),
      onToggleFavorite: (book) => {
        if (isFavorite(book.id)) {
          removeFavorite(book.id);
        } else {
          addFavorite(book);
        }
        favoritesDrawer.updateFavorites(getFavorites());
        resultsGrid.syncCardStates();
      }
    }
  );

  // 4. Initialize Favorites Drawer Component
  favoritesDrawer = new FavoritesDrawer(
    {
      section: document.getElementById('favorites-section'),
      badgeSubtitle: document.getElementById('favorites-badge-subtitle'),
      fabBadge: document.getElementById('fab-badge'),
      closeBtn: document.getElementById('close-favs-btn'),
      toggleFab: document.getElementById('toggle-favs-fab'),
      filterContainer: document.getElementById('favorites-filter-container'),
      filterInput: document.getElementById('favorites-filter-input'),
      emptyMsg: document.getElementById('favorites-empty-msg'),
      list: document.getElementById('favorites-list')
    },
    {
      onRemoveFavorite: (bookId) => {
        removeFavorite(bookId);
        favoritesDrawer.updateFavorites(getFavorites());
        resultsGrid.syncCardStates();
      }
    }
  );

  // Load initial favorites list from LocalStorage
  favoritesDrawer.updateFavorites(getFavorites());
}

// Execute app startup
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
