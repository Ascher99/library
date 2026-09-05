import { getHeartIconSvg, getBookIconSvg } from './icons.js';

export class FavoriteItem {
  /**
   * @param {Object} book The book document
   * @param {Object} callbacks Event callbacks
   * @param {Function} callbacks.onRemoveFavorite Callback when remove favorite is clicked
   */
  constructor(book, { onRemoveFavorite }) {
    this.book = book;
    this.onRemoveFavorite = onRemoveFavorite;
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

    item.innerHTML = `
      <div class="fav-item-cover">
        ${coverHtml}
        ${placeholderHtml}
      </div>
      <div class="fav-item-details">
        <h4 class="fav-item-title" title="${this.book.title}">${this.book.title}</h4>
        <p class="fav-item-author" title="${authorsString}">${authorsString}</p>
        <p class="fav-item-year">${this.book.publishYear}</p>
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

    this.element = item;
    return item;
  }
}
