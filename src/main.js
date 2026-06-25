// Import styling so Vite bundles and injects it
import './style.css';

import { searchBooks } from './api.js';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from './favorites.js';
import { initTheme, applyTheme } from './theme.js';
import { debounce } from './utils.js';

// ==========================================================================
// Application State
// ==========================================================================
let searchResults = []; // Cache current search results
let searchAuthorFilter = '';
let favoritesAuthorFilter = '';
let debounceTimeoutId = null;

// ==========================================================================
// DOM Elements Cache
// ==========================================================================
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchBtn = document.getElementById('search-btn');
const filterInput = document.getElementById('filter-input');
const searchFiltersBar = document.getElementById('search-filters-bar');

const statusContainer = document.getElementById('status-container');
const statusSpinner = document.getElementById('status-spinner');
const statusText = document.getElementById('status-text');
const resultsGrid = document.getElementById('results-grid');

const favoritesSection = document.getElementById('favorites-section');
const favoritesBadgeSubtitle = document.getElementById('favorites-badge-subtitle');
const fabBadge = document.getElementById('fab-badge');
const closeFavsBtn = document.getElementById('close-favs-btn');
const toggleFavsFab = document.getElementById('toggle-favs-fab');

const favoritesFilterContainer = document.getElementById('favorites-filter-container');
const favoritesFilterInput = document.getElementById('favorites-filter-input');
const favoritesEmptyMsg = document.getElementById('favorites-empty-msg');
const favoritesList = document.getElementById('favorites-list');

// Drawer Overlay for mobile responsive sidebar
let drawerOverlay = null;

// ==========================================================================
// SVG Icons Helper Functions (Clean, scalable vector icons)
// ==========================================================================
function getHeartIconSvg() {
  return `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6667 9.33333C13.66 8.36 14.6667 7.19333 14.6667 5.66667C14.6667 4.69421 14.2804 3.76158 13.5928 3.07394C12.9051 2.38631 11.9725 2 11 2C9.82671 2 9.00004 2.33333 8.00004 3.33333C7.00004 2.33333 6.17337 2 5.00004 2C4.02758 2 3.09495 2.38631 2.40732 3.07394C1.71968 3.76158 1.33337 4.69421 1.33337 5.66667C1.33337 7.2 2.33337 8.36667 3.33337 9.33333L8.00004 14L12.6667 9.33333Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function getBookIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 18C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V4C2 3.73478 2.10536 3.48043 2.29289 3.29289C2.48043 3.10536 2.73478 3 3 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3H21C21.2652 3 21.5196 3.10536 21.7071 3.29289C21.8946 3.48043 22 3.73478 22 4V17C22 17.2652 21.8946 17.5196 21.7071 17.7071C21.5196 17.8946 21.2652 18 21 18H15C14.2044 18 13.4413 18.3161 12.8787 18.8787C12.3161 19.4413 12 20.2044 12 21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ==========================================================================
// Rendering: Search Results Grid
// ==========================================================================
function renderSearchResults() {
  resultsGrid.innerHTML = '';
  
  // Filter by author if filter input is filled
  let filteredDocs = searchResults;
  if (searchAuthorFilter.trim()) {
    const authorQuery = searchAuthorFilter.toLowerCase().trim();
    filteredDocs = searchResults.filter(book => 
      book.authors.some(author => author.toLowerCase().includes(authorQuery))
    );
  }

  if (filteredDocs.length === 0) {
    resultsGrid.innerHTML = `
      <div class="card status-box" style="grid-column: 1 / -1; padding: 40px;">
        <p style="color: var(--text-secondary); font-weight: 500;">
          No search results match author filter "${searchAuthorFilter}".
        </p>
      </div>
    `;
    return;
  }

  filteredDocs.forEach(book => {
    const isSaved = isFavorite(book.id);
    const card = document.createElement('article');
    card.className = 'book-card';
    card.setAttribute('data-id', book.id);

    // Cover image layout or premium CSS book placeholder
    let coverHtml = '';
    if (book.coverId) {
      const coverUrl = `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`;
      coverHtml = `<img class="book-cover" src="${coverUrl}" alt="Cover of ${book.title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    const placeholderHtml = `
      <div class="no-cover-placeholder" style="${book.coverId ? 'display:none;' : ''}">
        <span class="no-cover-text">The Library</span>
        <svg class="no-cover-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 18C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V4C2 3.73478 2.10536 3.48043 2.29289 3.29289C2.48043 3.10536 2.73478 3 3 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3H21C21.2652 3 21.5196 3.10536 21.7071 3.29289C21.8946 3.48043 22 3.73478 22 4V17C22 17.2652 21.8946 17.5196 21.7071 17.7071C21.5196 17.8946 21.2652 18 21 18H15C14.2044 18 13.4413 18.3161 12.8787 18.8787C12.3161 19.4413 12 20.2044 12 21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="no-cover-title">${book.title}</span>
        <span class="no-cover-text">No Cover</span>
      </div>
    `;

    const authorsString = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown Author';
    
    // In accordance with the mockup, favorites button is a floating round button on top of the cover,
    // and no bottom button is rendered. Details contain: Title, Author, Year.
    card.innerHTML = `
      <div class="card-cover-container">
        ${coverHtml}
        ${placeholderHtml}
        <button class="fav-toggle-btn ${isSaved ? 'saved' : ''}" aria-label="${isSaved ? 'Remove from favorites' : 'Add to favorites'}" title="${isSaved ? 'Remove from favorites' : 'Add to favorites'}">
          ${getHeartIconSvg()}
        </button>
      </div>
      <div class="card-details">
        <h4 class="card-title" title="${book.title}">${book.title}</h4>
        <p class="card-author" title="${authorsString}">${authorsString}</p>
        <p class="card-year">${book.publishYear}</p>
      </div>
    `;

    // Bind event to toggle favorites directly on the floating heart button
    const favToggle = card.querySelector('.fav-toggle-btn');
    favToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavoriteStatus(book);
    });

    resultsGrid.appendChild(card);
  });
}

// ==========================================================================
// Rendering: Favorites Side Panel
// ==========================================================================
function renderFavorites() {
  favoritesList.innerHTML = '';
  const favorites = getFavorites();

  // Update Badge Label (e.g., "3 books saved")
  favoritesBadgeSubtitle.textContent = `${favorites.length} book${favorites.length === 1 ? '' : 's'} saved`;
  fabBadge.textContent = favorites.length;

  // Filter favorites by author if filter input is filled
  let filteredFavs = favorites;
  if (favoritesAuthorFilter.trim()) {
    const authorQuery = favoritesAuthorFilter.toLowerCase().trim();
    filteredFavs = favorites.filter(book => 
      book.authors.some(author => author.toLowerCase().includes(authorQuery))
    );
  }

  // Handle empty state
  if (favorites.length === 0) {
    favoritesEmptyMsg.style.display = 'flex';
    favoritesList.style.display = 'none';
    favoritesFilterContainer.style.display = 'none';
    return;
  } else {
    favoritesEmptyMsg.style.display = 'none';
    favoritesList.style.display = 'flex';
    favoritesFilterContainer.style.display = 'block';
  }

  if (filteredFavs.length === 0) {
    favoritesList.innerHTML = `
      <p style="font-size: 0.8rem; text-align: center; color: var(--text-muted); padding: 20px;">
        No favorites match filter "${favoritesAuthorFilter}"
      </p>
    `;
    return;
  }

  filteredFavs.forEach(book => {
    const item = document.createElement('div');
    item.className = 'fav-item';

    // Cover thumbnail image or CSS cover placeholder icon
    let coverHtml = '';
    if (book.coverId) {
      const coverUrl = `https://covers.openlibrary.org/b/id/${book.coverId}-S.jpg`;
      coverHtml = `<img src="${coverUrl}" alt="${book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    const placeholderHtml = `
      <div class="fav-item-cover-placeholder" style="${book.coverId ? 'display:none;' : ''}">
        ${getBookIconSvg()}
      </div>
    `;

    const authorsString = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown Author';

    // In accordance with the mockup, the remove button is a red heart on the right side of the list item
    item.innerHTML = `
      <div class="fav-item-cover">
        ${coverHtml}
        ${placeholderHtml}
      </div>
      <div class="fav-item-details">
        <h4 class="fav-item-title" title="${book.title}">${book.title}</h4>
        <p class="fav-item-author" title="${authorsString}">${authorsString}</p>
        <p class="fav-item-year">${book.publishYear}</p>
      </div>
      <button class="remove-fav-btn" aria-label="Remove ${book.title} from favorites" title="Remove from favorites">
        ${getHeartIconSvg()}
      </button>
    `;

    // Bind event to remove button (the red heart icon)
    item.querySelector('.remove-fav-btn').addEventListener('click', () => {
      removeFavorite(book.id);
      renderFavorites();
      syncCardStates();
    });

    favoritesList.appendChild(item);
  });
}

// Helper: Toggle favorite status of a book
function toggleFavoriteStatus(book) {
  if (isFavorite(book.id)) {
    removeFavorite(book.id);
  } else {
    addFavorite(book);
  }
  renderFavorites();
  syncCardStates();
}

// Helper: Syncs the active class on floating heart buttons in search results grid
function syncCardStates() {
  const cards = resultsGrid.querySelectorAll('.book-card');
  cards.forEach(card => {
    const id = card.getAttribute('data-id');
    const favToggle = card.querySelector('.fav-toggle-btn');
    if (!favToggle) return;

    const isSaved = isFavorite(id);
    if (isSaved) {
      favToggle.classList.add('saved');
      favToggle.setAttribute('aria-label', 'Remove from favorites');
      favToggle.setAttribute('title', 'Remove from favorites');
    } else {
      favToggle.classList.remove('saved');
      favToggle.setAttribute('aria-label', 'Add to favorites');
      favToggle.setAttribute('title', 'Add to favorites');
    }
  });
}

// ==========================================================================
// Operations: API Search Orchestrator
// ==========================================================================
async function performSearch(query) {
  const queryText = query ? query.trim() : '';
  
  if (!queryText) {
    searchResults = [];
    searchFiltersBar.hidden = true;
    resultsGrid.innerHTML = '';
    showStatusMessage('EMPTY_INPUT');
    return;
  }

  // Display loading status
  showStatusMessage('LOADING', queryText);
  resultsGrid.innerHTML = '';

  try {
    const books = await searchBooks(queryText);
    
    // If request was aborted internally, books will be null
    if (books === null) return;

    searchResults = books;
    
    // Reset author filters when doing a new search
    filterInput.value = '';
    searchAuthorFilter = '';
    searchFiltersBar.hidden = false;
    
    // Hide status container and render
    statusContainer.hidden = true;
    renderSearchResults();
  } catch (error) {
    searchResults = [];
    searchFiltersBar.hidden = true;
    resultsGrid.innerHTML = '';
    showStatusMessage(error.message, queryText);
  }
}

// Helper to show different status box states (Loading, Network Error, Empty Input, Nothing Found)
function showStatusMessage(state, query = '') {
  statusContainer.hidden = false;
  statusSpinner.hidden = true;

  switch (state) {
    case 'LOADING':
      statusSpinner.hidden = false;
      statusText.textContent = `Searching for books matching "${query}"...`;
      break;
    case 'EMPTY_INPUT':
      statusText.textContent = 'Enter a query above to start searching for books.';
      break;
    case 'NOTHING_FOUND':
      statusText.textContent = `No books found matching "${query}". Try searching for something else.`;
      break;
    case 'NETWORK_ERROR':
      statusText.textContent = 'Network error. Please check your internet connection and try again.';
      break;
    default:
      statusText.textContent = 'An unexpected error occurred. Please try again.';
      break;
  }
}

// ==========================================================================
// Mobile Responsive Drawer Handles
// ==========================================================================
function toggleFavoritesDrawer(forceClose = false) {
  const isOpen = favoritesSection.classList.contains('open');
  
  if (isOpen || forceClose) {
    favoritesSection.classList.remove('open');
    if (drawerOverlay) {
      drawerOverlay.remove();
      drawerOverlay = null;
    }
  } else {
    favoritesSection.classList.add('open');
    // Create and attach overlay if not present
    if (!drawerOverlay) {
      drawerOverlay = document.createElement('div');
      drawerOverlay.className = 'drawer-overlay';
      document.body.appendChild(drawerOverlay);
      drawerOverlay.addEventListener('click', () => toggleFavoritesDrawer(true));
    }
  }
}

// ==========================================================================
// Event Listeners Binding
// ==========================================================================
function bindEvents() {
  // Theme selection buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
    });
  });

  // Main search button
  searchBtn.addEventListener('click', () => {
    // Clear any pending debounces and search immediately
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
    }
    performSearch(searchInput.value);
  });

  // Debounced search on-the-fly typing
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    
    // Toggle clear search button visibility
    clearSearchBtn.hidden = !val;

    // Clear previous timer
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
    }

    // Debounce for 500ms
    debounceTimeoutId = setTimeout(() => {
      performSearch(val);
    }, 500);
  });

  // Clear search query button
  clearSearchBtn.addEventListener('click', () => {
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
    }
    searchInput.value = '';
    clearSearchBtn.hidden = true;
    performSearch('');
  });

  // Press Enter key inside search box
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId);
      }
      performSearch(searchInput.value);
    }
  });

  // Filter Search Results by Author (Instantly filters current cached search results)
  filterInput.addEventListener('input', (e) => {
    searchAuthorFilter = e.target.value;
    renderSearchResults();
  });

  // Filter Favorites by Author
  favoritesFilterInput.addEventListener('input', (e) => {
    favoritesAuthorFilter = e.target.value;
    renderFavorites();
  });

  // Mobile drawer FAB toggle
  toggleFavsFab.addEventListener('click', () => toggleFavoritesDrawer());
  
  // Mobile drawer Close button
  closeFavsBtn.addEventListener('click', () => toggleFavoritesDrawer(true));

  // Automatically close mobile drawer when window resizes back to desktop size
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      toggleFavoritesDrawer(true);
    }
  });
}

// ==========================================================================
// Initialization
// ==========================================================================
function init() {
  initTheme();
  bindEvents();
  renderFavorites();
}

// Execute app startup
document.addEventListener('DOMContentLoaded', init);
// Run init immediately in case DOMContentLoaded already fired (vite dev HMR compatibility)
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
