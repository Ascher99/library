import {
  getHeartIconSvg,
  getCloseIconSvg,
  getExternalLinkIconSvg,
  getCheckCircleIconSvg,
  getBookmarkIconSvg,
  getOpenBookIconSvg,
  getNoteIconSvg
} from './icons.js';

export class BookModal {
  /**
   * @param {Object} callbacks Event callbacks
   * @param {Function} callbacks.isFavorite Check if book is saved
   * @param {Function} callbacks.getFavoriteById Get saved favorite book
   * @param {Function} callbacks.onToggleFavorite Toggle favorite state
   * @param {Function} callbacks.onUpdateMeta Update reading status or notes
   */
  constructor({ isFavorite, getFavoriteById, onToggleFavorite, onUpdateMeta }) {
    this.isFavorite = isFavorite;
    this.getFavoriteById = getFavoriteById;
    this.onToggleFavorite = onToggleFavorite;
    this.onUpdateMeta = onUpdateMeta;

    this.activeBook = null;
    this.container = null;
    this.keydownHandler = null;
  }

  /**
   * Opens the modal for a specific book document.
   * @param {Object} book Book document object
   */
  open(book) {
    this.close(); // Close any currently open modal first

    const savedBook = this.getFavoriteById(book.id);
    const isSaved = this.isFavorite(book.id);
    
    // Use saved meta or fallback defaults
    this.activeBook = {
      ...book,
      readingStatus: savedBook?.readingStatus || 'want_to_read',
      notes: savedBook?.notes || ''
    };

    this.render();
    this.bindEvents();
    document.body.style.overflow = 'hidden'; // Lock background scrolling
  }

  /**
   * Closes the active modal and cleans up listeners.
   */
  close() {
    if (this.container) {
      this.container.classList.remove('active');
      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
      }, 200);
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    document.body.style.overflow = '';
  }

  render() {
    const book = this.activeBook;
    const isSaved = this.isFavorite(book.id);
    const authorsString = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown Author';

    let coverHtml = '';
    if (book.coverId) {
      const coverUrl = `https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`;
      coverHtml = `<img class="modal-cover-img" src="${coverUrl}" alt="Cover of ${book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }

    const placeholderHtml = `
      <div class="no-cover-placeholder modal-placeholder" style="${book.coverId ? 'display:none;' : ''}">
        <span class="no-cover-text">The Library</span>
        <svg class="no-cover-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 18C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V4C2 3.73478 2.10536 3.48043 2.29289 3.29289C2.48043 3.10536 2.73478 3 3 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3H21C21.2652 3 21.5196 3.10536 21.7071 3.29289C21.8946 3.48043 22 3.73478 22 4V17C22 17.2652 21.8946 17.5196 21.7071 17.7071C21.5196 17.8946 21.2652 18 21 18H15C14.2044 18 13.4413 18.3161 12.8787 18.8787C12.3161 19.4413 12 20.2044 12 21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="no-cover-title">${book.title}</span>
      </div>
    `;

    const openLibraryUrl = `https://openlibrary.org${book.id}`;

    const container = document.createElement('div');
    container.className = 'modal-backdrop';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-labelledby', 'modal-book-title');

    container.innerHTML = `
      <div class="modal-card">
        <button class="modal-close-btn" aria-label="Close modal">
          ${getCloseIconSvg()}
        </button>

        <div class="modal-body">
          <div class="modal-cover-column">
            <div class="modal-cover-frame">
              ${coverHtml}
              ${placeholderHtml}
            </div>
            
            <a href="${openLibraryUrl}" target="_blank" rel="noopener noreferrer" class="modal-ext-link">
              <span>View on Open Library</span>
              ${getExternalLinkIconSvg()}
            </a>
          </div>

          <div class="modal-content-column">
            <header class="modal-header">
              <h2 id="modal-book-title" class="modal-title">${book.title}</h2>
              <p class="modal-author">by <span>${authorsString}</span></p>
              <div class="modal-meta-row">
                <span class="modal-chip">Published ${book.publishYear}</span>
              </div>
            </header>

            <div class="modal-action-bar">
              <button class="modal-fav-btn ${isSaved ? 'saved' : ''}">
                ${getHeartIconSvg()}
                <span>${isSaved ? 'Saved to Favorites' : 'Add to Favorites'}</span>
              </button>
            </div>

            <div class="modal-section modal-status-section" style="${isSaved ? '' : 'display:none;'}">
              <h4 class="modal-section-title">Reading Status</h4>
              <div class="status-pill-group">
                <button class="status-pill ${book.readingStatus === 'want_to_read' ? 'active' : ''}" data-status="want_to_read">
                  ${getBookmarkIconSvg()}
                  <span>Want to Read</span>
                </button>
                <button class="status-pill ${book.readingStatus === 'reading' ? 'active' : ''}" data-status="reading">
                  ${getOpenBookIconSvg()}
                  <span>Currently Reading</span>
                </button>
                <button class="status-pill ${book.readingStatus === 'completed' ? 'active' : ''}" data-status="completed">
                  ${getCheckCircleIconSvg()}
                  <span>Completed</span>
                </button>
              </div>
            </div>

            <div class="modal-section modal-notes-section" style="${isSaved ? '' : 'display:none;'}">
              <div class="modal-section-header">
                <h4 class="modal-section-title">
                  ${getNoteIconSvg()}
                  <span>Personal Notes & Highlights</span>
                </h4>
              </div>
              <textarea class="modal-notes-input" placeholder="Add your favorite quotes, thoughts, or review notes for this book...">${book.notes}</textarea>
              <span class="modal-notes-hint">Notes automatically save to your local library.</span>
            </div>

            ${!isSaved ? `
              <div class="modal-fav-prompt">
                <p>Save this book to your Favorites to track your reading status and keep custom notes.</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.container = container;

    // Trigger frame animation
    requestAnimationFrame(() => {
      container.classList.add('active');
    });
  }

  bindEvents() {
    if (!this.container) return;

    // Close button
    const closeBtn = this.container.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    // Escape key
    this.keydownHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    // Favorite toggle button
    const favBtn = this.container.querySelector('.modal-fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        if (this.onToggleFavorite) {
          this.onToggleFavorite(this.activeBook);
          const isSavedNow = this.isFavorite(this.activeBook.id);
          // Re-render modal to toggle status & notes fields
          this.activeBook.readingStatus = 'want_to_read';
          this.render();
          this.bindEvents();
        }
      });
    }

    // Reading status pills
    const statusPills = this.container.querySelectorAll('.status-pill');
    statusPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const newStatus = pill.getAttribute('data-status');
        this.activeBook.readingStatus = newStatus;
        statusPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if (this.onUpdateMeta) {
          this.onUpdateMeta(this.activeBook.id, { readingStatus: newStatus });
        }
      });
    });

    // Notes textarea input (auto save on input)
    const notesInput = this.container.querySelector('.modal-notes-input');
    if (notesInput) {
      notesInput.addEventListener('input', (e) => {
        const newNotes = e.target.value;
        this.activeBook.notes = newNotes;
        if (this.onUpdateMeta) {
          this.onUpdateMeta(this.activeBook.id, { notes: newNotes });
        }
      });
    }
  }
}
