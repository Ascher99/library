const LOCAL_STORAGE_KEY = 'lumina_favorites';

// In-memory cache to prevent constant localStorage reads & JSON parsing
let favoritesCache = initFavoritesCache();
let favoriteIdsSet = new Set(favoritesCache.map(f => f.id));

/**
 * Initializes favorites cache from localStorage on load.
 * Ensures all objects have fallback fields for readingStatus and notes.
 * @returns {Array} List of favorite books
 */
function initFavoritesCache() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map(b => ({
      readingStatus: 'want_to_read',
      notes: '',
      ...b
    }));
  } catch (e) {
    console.error('Error reading favorites from localStorage:', e);
    return [];
  }
}

/**
 * Retrieves the array of favorite books.
 * @returns {Array}
 */
export function getFavorites() {
  return [...favoritesCache];
}

/**
 * Retrieves a single favorite book by ID.
 * @param {string} bookId 
 * @returns {Object|null}
 */
export function getFavoriteById(bookId) {
  return favoritesCache.find(f => f.id === bookId) || null;
}

/**
 * Saves the array of favorite books to localStorage and updates in-memory cache.
 * @param {Array} favorites The favorites list
 */
function saveFavorites(favorites) {
  favoritesCache = favorites;
  favoriteIdsSet = new Set(favorites.map(f => f.id));
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favoritesCache));
  } catch (e) {
    console.error('Error writing favorites to localStorage:', e);
  }
}

/**
 * Adds a book to favorites if not already favorited.
 * @param {Object} book The book object
 * @returns {Array} The updated favorites list
 */
export function addFavorite(book) {
  if (!favoriteIdsSet.has(book.id)) {
    const bookToAdd = {
      readingStatus: 'want_to_read',
      notes: '',
      ...book
    };
    const updated = [...favoritesCache, bookToAdd];
    saveFavorites(updated);
  }
  return [...favoritesCache];
}

/**
 * Updates metadata (reading status, personal notes) for a favorited book.
 * @param {string} bookId The book ID
 * @param {Object} meta Updates object ({ readingStatus, notes })
 * @returns {Array} Updated favorites list
 */
export function updateFavoriteMeta(bookId, meta) {
  const index = favoritesCache.findIndex(f => f.id === bookId);
  if (index !== -1) {
    favoritesCache[index] = {
      ...favoritesCache[index],
      ...meta
    };
    saveFavorites([...favoritesCache]);
  }
  return [...favoritesCache];
}

/**
 * Removes a book from favorites by its ID.
 * @param {string} bookId The book ID
 * @returns {Array} The updated favorites list
 */
export function removeFavorite(bookId) {
  if (favoriteIdsSet.has(bookId)) {
    const updated = favoritesCache.filter(f => f.id !== bookId);
    saveFavorites(updated);
  }
  return [...favoritesCache];
}

/**
 * Checks if a book is already in the favorites (O(1) Set lookup).
 * @param {string} bookId The book ID
 * @returns {boolean} True if favorited
 */
export function isFavorite(bookId) {
  return favoriteIdsSet.has(bookId);
}


