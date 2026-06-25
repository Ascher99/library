const LOCAL_STORAGE_KEY = 'lumina_favorites';

/**
 * Retrieves the array of favorite books from localStorage.
 * @returns {Array<{id: string, title: string, authors: Array<string>, publishYear: (number|string), coverId: ?number}>}
 */
export function getFavorites() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading favorites from localStorage:', e);
    return [];
  }
}

/**
 * Saves the array of favorite books to localStorage.
 * @param {Array} favorites The favorites list
 */
function saveFavorites(favorites) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
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
  const favorites = getFavorites();
  if (!favorites.some(f => f.id === book.id)) {
    favorites.push(book);
    saveFavorites(favorites);
  }
  return favorites;
}

/**
 * Removes a book from favorites by its ID.
 * @param {string} bookId The book ID
 * @returns {Array} The updated favorites list
 */
export function removeFavorite(bookId) {
  let favorites = getFavorites();
  favorites = favorites.filter(f => f.id !== bookId);
  saveFavorites(favorites);
  return favorites;
}

/**
 * Checks if a book is already in the favorites.
 * @param {string} bookId The book ID
 * @returns {boolean} True if favorited
 */
export function isFavorite(bookId) {
  const favorites = getFavorites();
  return favorites.some(f => f.id === bookId);
}
