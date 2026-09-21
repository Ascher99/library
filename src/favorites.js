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
      rating: 0,
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
      rating: 0,
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
 * Exports current favorites list as a downloadable Markdown (.md) reading journal.
 */
export function exportFavoritesMarkdown() {
  const stats = getReadingStats();
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  
  let md = `# 📚 My Library Reading List\n\n`;
  md += `*Generated on ${dateStr}*\n\n`;
  md += `## 📊 Reading Summary\n\n`;
  md += `- **Total Books Saved:** ${stats.total}\n`;
  md += `- **Completed:** ${stats.completed} / ${stats.targetGoal} books (${stats.progressPct}% of goal)\n`;
  md += `- **Currently Reading:** ${stats.reading}\n`;
  md += `- **Want to Read:** ${stats.wantToRead}\n`;
  if (stats.avgRating) {
    md += `- **Average Rating:** ${stats.avgRating} / 5 ⭐\n`;
  }
  md += `\n---\n\n`;

  const statusSections = [
    { key: 'reading', title: '📖 Currently Reading' },
    { key: 'want_to_read', title: '🔖 Want to Read' },
    { key: 'completed', title: '✅ Completed' }
  ];

  statusSections.forEach(({ key, title }) => {
    const booksInStatus = favoritesCache.filter(b => (b.readingStatus || 'want_to_read') === key);
    if (booksInStatus.length > 0) {
      md += `## ${title} (${booksInStatus.length})\n\n`;
      booksInStatus.forEach(book => {
        const authors = Array.isArray(book.authors) && book.authors.length ? book.authors.join(', ') : 'Unknown Author';
        const link = book.id.startsWith('/') ? `https://openlibrary.org${book.id}` : `https://openlibrary.org/${book.id}`;
        const ratingStars = book.rating > 0 ? '⭐'.repeat(book.rating) : 'Unrated';
        
        md += `### [${book.title}](${link})\n`;
        md += `- **Author(s):** ${authors}\n`;
        md += `- **Published:** ${book.publishYear || 'Unknown'}\n`;
        md += `- **Rating:** ${ratingStars}\n`;
        if (book.notes && book.notes.trim()) {
          md += `- **Notes & Quotes:**\n> ${book.notes.trim().replace(/\n/g, '\n> ')}\n`;
        }
        md += `\n`;
      });
    }
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'library-reading-list.md';
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
        rating: 0,
        authors: Array.isArray(importedBook.authors) ? importedBook.authors : ['Unknown Author'],
        coverId: importedBook.coverId || null,
        ...importedBook,
        publishYear: importedBook.publishYear || importedBook.firstPublishYear || 'Unknown Year',
        readingStatus: importedBook.readingStatus || (existing ? existing.readingStatus : 'want_to_read'),
        notes: importedBook.notes !== undefined ? importedBook.notes : (existing ? existing.notes : ''),
        rating: typeof importedBook.rating === 'number' ? importedBook.rating : (existing ? existing.rating || 0 : 0)
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

const GOAL_STORAGE_KEY = 'lumina_reading_goal';

/**
 * Gets the target reading goal count from localStorage (default: 5)
 * @returns {number}
 */
export function getReadingGoal() {
  try {
    const val = localStorage.getItem(GOAL_STORAGE_KEY);
    return val ? Math.max(1, parseInt(val, 10) || 5) : 5;
  } catch (e) {
    return 5;
  }
}

/**
 * Saves a new reading goal target count to localStorage
 * @param {number} goal Target count
 * @returns {number} Sanitized target count
 */
export function setReadingGoal(goal) {
  const sanitized = Math.max(1, Math.min(999, parseInt(goal, 10) || 5));
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, sanitized.toString());
  } catch (e) {
    console.error('Error writing reading goal to localStorage:', e);
  }
  return sanitized;
}

/**
 * Computes detailed reading statistics and milestone achievements from favorites cache.
 * @returns {Object} Statistics object
 */
export function getReadingStats() {
  const total = favoritesCache.length;
  const completed = favoritesCache.filter(f => f.readingStatus === 'completed').length;
  const reading = favoritesCache.filter(f => f.readingStatus === 'reading').length;
  const wantToRead = favoritesCache.filter(f => (f.readingStatus || 'want_to_read') === 'want_to_read').length;
  
  const ratedBooks = favoritesCache.filter(f => typeof f.rating === 'number' && f.rating > 0);
  const avgRating = ratedBooks.length > 0
    ? (ratedBooks.reduce((sum, f) => sum + f.rating, 0) / ratedBooks.length).toFixed(1)
    : null;

  const targetGoal = getReadingGoal();
  const progressPct = Math.min(100, Math.round((completed / targetGoal) * 100));

  const milestones = [];
  if (total >= 1) {
    milestones.push({ id: 'first_book', label: 'First Bookmark', icon: '🔖', desc: 'Saved your first book to favorites' });
  }
  if (completed >= 1) {
    milestones.push({ id: 'first_completed', label: 'Bookworm Start', icon: '📖', desc: 'Finished reading your first book' });
  }
  if (completed >= Math.ceil(targetGoal / 2) && targetGoal > 1 && completed > 0) {
    milestones.push({ id: 'halfway', label: 'Halfway Mark', icon: '⚡', desc: 'Reached 50% of your reading goal' });
  }
  if (completed >= targetGoal && targetGoal > 0) {
    milestones.push({ id: 'goal_achieved', label: 'Goal Achieved', icon: '🏆', desc: 'Successfully hit your annual reading goal!' });
  }
  if (completed >= 10) {
    milestones.push({ id: 'avid_reader', label: 'Avid Scholar', icon: '🎓', desc: 'Completed 10+ books in your library' });
  }

  return {
    total,
    completed,
    reading,
    wantToRead,
    targetGoal,
    progressPct,
    avgRating,
    milestones
  };
}





