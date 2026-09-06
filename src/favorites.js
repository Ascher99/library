const LOCAL_STORAGE_KEY = 'lumina_favorites';

// In-memory cache to prevent constant localStorage reads & JSON parsing
let favoritesCache = initFavoritesCache();
let favoriteIdsSet = new Set(favoritesCache.map(f => f.id));

/**
 * Initializes favorites cache from localStorage on load.
 * @returns {Array} List of favorite books
 */
function initFavoritesCache() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading favorites from localStorage:', e);
    return [];
  }
}

/**
 * Retrieves the array of favorite books.
 * @returns {Array<{id: string, title: string, authors: Array<string>, publishYear: (number|string), coverId: ?number}>}
 */
export function getFavorites() {
  return [...favoritesCache];
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
    const updated = [...favoritesCache, book];
    saveFavorites(updated);
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

