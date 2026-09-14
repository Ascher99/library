let currentAbortController = null;

/**
 * Searches books on Open Library API by the given query.
 * @param {string} query The search query string
 * @returns {Promise<Array<{id: string, title: string, authors: Array<string>, publishYear: (number|string), coverId: ?number}>|null>}
 */
export async function searchBooks(query) {
  // Handle empty input state
  if (!query || !query.trim()) {
    throw new Error('EMPTY_INPUT');
  }

  // Cancel any active search request before launching a new one
  if (currentAbortController) {
    currentAbortController.abort();
  }

  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}`;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error('NETWORK_ERROR');
    }

    const data = await response.json();

    // Handle nothing found state
    if (!data.docs || data.docs.length === 0) {
      throw new Error('NOTHING_FOUND');
    }

    // Map response to a clean, usable data contract
    return data.docs.map(doc => ({
      id: doc.key,
      title: doc.title,
      authors: doc.author_name || [],
      publishYear: doc.first_publish_year || 'Unknown Year',
      coverId: doc.cover_i || null
    }));
  } catch (error) {
    // If the request was aborted due to a new search, return null silently
    if (error.name === 'AbortError') {
      return null;
    }

    if (error.message === 'NOTHING_FOUND') {
      throw error;
    }

    // Treat other errors (CORS, network failure, server down) as network error
    throw new Error('NETWORK_ERROR');
  }
}

const POPULAR_SUBJECTS = [
  'fiction',
  'classic',
  'fantasy',
  'mystery',
  'science fiction',
  'history',
  'philosophy',
  'adventure',
  'thriller',
  'poetry'
];

/**
 * Fetches search results for a randomly selected popular topic and returns a random book recommendation.
 * @returns {Promise<{ surpriseBook: Object, books: Array<Object>, subject: string }>}
 */
export async function fetchRandomBook() {
  const randomSubject = POPULAR_SUBJECTS[Math.floor(Math.random() * POPULAR_SUBJECTS.length)];
  const books = await searchBooks(randomSubject);

  if (!books || books.length === 0) {
    throw new Error('NOTHING_FOUND');
  }

  // Pick a random book from the top results (up to first 15 for relevance)
  const candidatePool = books.slice(0, Math.min(books.length, 15));
  const surpriseBook = candidatePool[Math.floor(Math.random() * candidatePool.length)];

  return {
    surpriseBook,
    books,
    subject: randomSubject
  };
}

