import { getHeartIconSvg, getBookIconSvg, getNoteIconSvg, getStarIconSvg } from './icons.js';

export class FavoriteItem {
  /**
   * @param {Object} book The book document
   * @param {Object} callbacks Event callbacks
   * @param {Function} callbacks.onRemoveFavorite Callback when remove favorite is clicked
   * @param {Function} callbacks.onSelectBook Callback when favorite item is clicked
   */
  constructor(book, { onRemoveFavorite, onSelectBook }) {
    this.book = book;
    this.onRemoveFavorite = onRemoveFavorite;
    this.onSelectBook = onSelectBook;
    this.element = null;
  }

  /**
   * Render the favorite item element.
   * @returns {HTMLElement} The populated item element
   */
  render() {
    const item = document.createElement('div');
    item.className = 'fav-item';

    let coverHtml = '';
    if (this.book.coverId) {
      const coverUrl = `https://covers.openlibrary.org/b/id/${this.book.coverId}-S.jpg`;
      coverHtml = `<img src="${coverUrl}" alt="${this.book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }

    const placeholderHtml = `
      <div class="fav-item-cover-placeholder" style="${this.book.coverId ? 'display:none;' : ''}">
        ${getBookIconSvg()}
      </div>
    `;

    const authorsString = this.book.authors.length > 0 ? this.book.authors.join(', ') : 'Unknown Author';

    const statusLabels = {
      want_to_read: 'Want to Read',
      reading: 'Reading',
      completed: 'Completed'
    };
    const statusText = statusLabels[this.book.readingStatus] || 'Want to Read';
    const hasNotes = Boolean(this.book.notes && this.book.notes.trim());
    const ratingHtml = this.book.rating > 0 
      ? `<span class="fav-item-rating" title="Rated ${this.book.rating}/5 stars">${getStarIconSvg(true)} <span>${this.book.rating}</span></span>` 
      : '';

    item.innerHTML = `
      <div class="fav-item-cover">
        ${coverHtml}
        ${placeholderHtml}
      </div>
      <div class="fav-item-details">
        <h4 class="fav-item-title" title="${this.book.title}">
          ${this.book.title}
          ${hasNotes ? `<span class="note-indicator-icon" title="Contains personal note">${getNoteIconSvg()}</span>` : ''}
        </h4>
        <p class="fav-item-author" title="${authorsString}">${authorsString}</p>
        <div class="fav-item-meta-row">
          <span class="fav-item-status status-${this.book.readingStatus || 'want_to_read'}">${statusText}</span>
          ${ratingHtml}
          <span class="fav-item-year">${this.book.publishYear}</span>
        </div>
      </div>
      <button class="remove-fav-btn" aria-label="Remove ${this.book.title} from favorites" title="Remove from favorites">
        ${getHeartIconSvg()}
      </button>
    `;

    const removeBtn = item.querySelector('.remove-fav-btn');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onRemoveFavorite) {
        this.onRemoveFavorite(this.book.id);
      }
    });

    item.addEventListener('click', () => {
      if (this.onSelectBook) {
        this.onSelectBook(this.book);
      }
    });

    this.element = item;
    return item;
  }
}

