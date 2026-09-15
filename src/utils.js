/**
 * Creates a debounced version of a function that delays execution
 * until after `delay` milliseconds have elapsed since the last call.
 * @param {Function} fn The function to debounce
 * @param {number} delay Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Escapes special HTML characters to prevent XSS and HTML attribute breaking.
 * @param {string|number} str String to escape
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Copies formatted book information to the user's clipboard.
 * @param {Object} book Book object
 * @returns {Promise<boolean>} Success state
 */
export async function shareBookDetails(book) {
  if (!book) return false;

  const title = book.title || 'Untitled Book';
  const authors = Array.isArray(book.authors) && book.authors.length > 0 ? book.authors.join(', ') : 'Unknown Author';
  const year = book.publishYear || 'Unknown Year';
  const openLibraryUrl = book.id ? (book.id.startsWith('/') ? `https://openlibrary.org${book.id}` : `https://openlibrary.org/${book.id}`) : '';

  const shareText = `📚 "${title}" by ${authors} (${year})\n${openLibraryUrl ? `Check it out on Open Library: ${openLibraryUrl}` : ''}`;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API failed, attempting fallback...', err);
  }

  // Fallback for older browsers
  try {
    const textarea = document.createElement('textarea');
    textarea.value = shareText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

let activeToastTimeout = null;

/**
 * Displays a global floating toast notification message.
 * @param {string} message Text message to display
 * @param {'success'|'info'|'error'} [type='success'] Notification visual style
 * @param {number} [duration=3000] Visible duration in ms
 */
export function showGlobalToast(message, type = 'success', duration = 3000) {
  let toastEl = document.getElementById('global-toast');

  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'global-toast';
    toastEl.className = 'global-toast';
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = message;
  toastEl.className = `global-toast toast-${type} active`;

  if (activeToastTimeout) {
    clearTimeout(activeToastTimeout);
  }

  activeToastTimeout = setTimeout(() => {
    toastEl.classList.remove('active');
  }, duration);
}


