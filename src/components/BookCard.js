import { getHeartIconSvg } from './icons.js';

export class BookCard {
  /**
   * @param {Object} book The book data object
   * @param {boolean} isSaved Initial favorite status
   * @param {Object} callbacks Event callbacks
   * @param {Function} callbacks.onToggleFavorite Callback when favorite button is clicked
   */
  constructor(book, isSaved, { onToggleFavorite }) {
    this.book = book;
    this.isSaved = isSaved;
    this.onToggleFavorite = onToggleFavorite;
    this.element = null;
  }

  /**
   * Render the book card element and bind click listeners.
   * @returns {HTMLElement} The populated book card element
   */
  render() {
    const card = document.createElement('article');
    card.className = 'book-card';
    card.setAttribute('data-id', this.book.id);

    let coverHtml = '';
    if (this.book.coverId) {
      const coverUrl = `https://covers.openlibrary.org/b/id/${this.book.coverId}-M.jpg`;
      coverHtml = `<img class="book-cover" src="${coverUrl}" alt="Cover of ${this.book.title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }

    const placeholderHtml = `
      <div class="no-cover-placeholder" style="${this.book.coverId ? 'display:none;' : ''}">
        <span class="no-cover-text">The Library</span>
        <svg class="no-cover-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 18C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V4C2 3.73478 2.10536 3.48043 2.29289 3.29289C2.48043 3.10536 2.73478 3 3 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3H21C21.2652 3 21.5196 3.10536 21.7071 3.29289C21.8946 3.48043 22 3.73478 22 4V17C22 17.2652 21.8946 17.5196 21.7071 17.7071C21.5196 17.8946 21.2652 18 21 18H15C14.2044 18 13.4413 18.3161 12.8787 18.8787C12.3161 19.4413 12 20.2044 12 21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="no-cover-title">${this.book.title}</span>
        <span class="no-cover-text">No Cover</span>
      </div>
    `;

    const authorsString = this.book.authors.length > 0 ? this.book.authors.join(', ') : 'Unknown Author';

    card.innerHTML = `
      <div class="card-cover-container">
        ${coverHtml}
        ${placeholderHtml}
        <button class="fav-toggle-btn ${this.isSaved ? 'saved' : ''}" aria-label="${this.isSaved ? 'Remove from favorites' : 'Add to favorites'}" title="${this.isSaved ? 'Remove from favorites' : 'Add to favorites'}">
          ${getHeartIconSvg()}
        </button>
      </div>
      <div class="card-details">
        <h4 class="card-title" title="${this.book.title}">${this.book.title}</h4>
        <p class="card-author" title="${authorsString}">${authorsString}</p>
        <p class="card-year">${this.book.publishYear}</p>
      </div>
    `;

    const favToggleBtn = card.querySelector('.fav-toggle-btn');
    favToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onToggleFavorite) {
        this.onToggleFavorite(this.book);
      }
    });

    this.element = card;
    return card;
  }

  /**
   * Update the favorite badge state on this card without complete re-rendering.
   * @param {boolean} isSaved Whether the card is saved
   */
  setSavedState(isSaved) {
    this.isSaved = isSaved;
    if (!this.element) return;
    
    const favToggleBtn = this.element.querySelector('.fav-toggle-btn');
    if (!favToggleBtn) return;

    if (isSaved) {
      favToggleBtn.classList.add('saved');
      favToggleBtn.setAttribute('aria-label', 'Remove from favorites');
      favToggleBtn.setAttribute('title', 'Remove from favorites');
    } else {
      favToggleBtn.classList.remove('saved');
      favToggleBtn.setAttribute('aria-label', 'Add to favorites');
      favToggleBtn.setAttribute('title', 'Add to favorites');
    }
  }
}
