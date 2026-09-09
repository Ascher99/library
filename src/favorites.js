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

/**
 * Exports current favorites list as a downloadable JSON file.
 */
export function exportFavoritesJSON() {
  const jsonString = JSON.stringify(favoritesCache, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lumina-favorites.json';
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports books from a JSON string into favorites cache and localStorage.
 * Merges new items with existing favorites without creating duplicate IDs.
 * @param {string} jsonText The raw JSON content from imported file
 * @returns {Object} { success: boolean, totalCount: number, addedCount: number, error?: string }
 */
export function importFavoritesJSON(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'Imported file must contain a list of books.' };
    }

    let addedCount = 0;
    const currentFavsMap = new Map(favoritesCache.map(item => [item.id, item]));

    parsed.forEach(importedBook => {
      if (!importedBook || typeof importedBook !== 'object' || !importedBook.id || !importedBook.title) {
        return; // Skip invalid book objects
      }

      const existing = currentFavsMap.get(importedBook.id);
      const sanitized = {
        readingStatus: 'want_to_read',
        notes: '',
        authors: Array.isArray(importedBook.authors) ? importedBook.authors : ['Unknown Author'],
        firstPublishYear: importedBook.firstPublishYear || 'N/A',
        coverUrl: importedBook.coverUrl || null,
        ...importedBook,
        readingStatus: importedBook.readingStatus || (existing ? existing.readingStatus : 'want_to_read'),
        notes: importedBook.notes !== undefined ? importedBook.notes : (existing ? existing.notes : '')
      };

      if (!existing) {
        addedCount++;
      }
      currentFavsMap.set(importedBook.id, sanitized);
    });

    const updatedList = Array.from(currentFavsMap.values());
    saveFavorites(updatedList);

    return {
      success: true,
      totalCount: updatedList.length,
      addedCount
    };
  } catch (err) {
    console.error('Error importing favorites JSON:', err);
    return { success: false, error: 'Invalid JSON file structure.' };
  }
}



