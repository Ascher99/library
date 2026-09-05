import { FavoriteItem } from './FavoriteItem.js';

export class FavoritesDrawer {
  /**
   * @param {Object} elements DOM elements
   * @param {HTMLElement} elements.section The main side panel container
   * @param {HTMLElement} elements.badgeSubtitle Header subtitle count label
   * @param {HTMLElement} elements.fabBadge Mobile FAB badge label
   * @param {HTMLElement} elements.closeBtn Mobile drawer close button
   * @param {HTMLElement} elements.toggleFab Mobile floating action button
   * @param {HTMLElement} elements.filterContainer Container for search filter input
   * @param {HTMLInputElement} elements.filterInput Filter input element
   * @param {HTMLElement} elements.emptyMsg The empty message container
   * @param {HTMLElement} elements.list The favorites list items container
   * @param {Object} callbacks Event callbacks
   * @param {Function} callbacks.onRemoveFavorite Triggered when removing a book
   */
  constructor(
    { section, badgeSubtitle, fabBadge, closeBtn, toggleFab, filterContainer, filterInput, emptyMsg, list },
    { onRemoveFavorite }
  ) {
    this.section = section;
    this.badgeSubtitle = badgeSubtitle;
    this.fabBadge = fabBadge;
    this.closeBtn = closeBtn;
    this.toggleFab = toggleFab;
    this.filterContainer = filterContainer;
    this.filterInput = filterInput;
    this.emptyMsg = emptyMsg;
    this.list = list;

    this.onRemoveFavorite = onRemoveFavorite;
    
    this.favorites = [];
    this.authorFilter = '';
    this.drawerOverlay = null;

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Open/Close Drawer via Mobile FAB
    this.toggleFab.addEventListener('click', () => this.toggle());

    // Close via Close Button
    this.closeBtn.addEventListener('click', () => this.toggle(true));

    // Filter input typing
    this.filterInput.addEventListener('input', (e) => {
      this.authorFilter = e.target.value;
      this.render();
    });

    // Handle screen resize, auto close on desktop view
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        this.toggle(true);
      }
    });
  }

  /**
   * Opens or closes the mobile drawer layout.
   * @param {boolean} forceClose Force closure of the drawer
   */
  toggle(forceClose = false) {
    const isOpen = this.section.classList.contains('open');

    if (isOpen || forceClose) {
      this.section.classList.remove('open');
      if (this.drawerOverlay) {
        this.drawerOverlay.remove();
        this.drawerOverlay = null;
      }
    } else {
      this.section.classList.add('open');
      if (!this.drawerOverlay) {
        this.drawerOverlay = document.createElement('div');
        this.drawerOverlay.className = 'drawer-overlay';
        document.body.appendChild(this.drawerOverlay);
        this.drawerOverlay.addEventListener('click', () => this.toggle(true));
      }
    }
  }

  /**
   * Updates the list of favorites.
   * @param {Array} favorites Array of favorite books
   */
  updateFavorites(favorites) {
    this.favorites = favorites;
    
    // Reset filter query only if favorites list becomes empty
    if (favorites.length === 0) {
      this.authorFilter = '';
      this.filterInput.value = '';
    }

    this.render();
  }

  /**
   * Renders the favorites list drawer items.
   */
  render() {
    this.list.innerHTML = '';
    const totalCount = this.favorites.length;

    // Update labels and count indicators
    this.badgeSubtitle.textContent = `${totalCount} book${totalCount === 1 ? '' : 's'} saved`;
    this.fabBadge.textContent = totalCount;

    if (totalCount === 0) {
      this.emptyMsg.style.display = 'flex';
      this.list.style.display = 'none';
      this.filterContainer.style.display = 'none';
      return;
    } else {
      this.emptyMsg.style.display = 'none';
      this.list.style.display = 'flex';
      this.filterContainer.style.display = 'block';
    }

    let filteredFavs = this.favorites;
    if (this.authorFilter.trim()) {
      const authorQuery = this.authorFilter.toLowerCase().trim();
      filteredFavs = this.favorites.filter(book =>
        book.authors.some(author => author.toLowerCase().includes(authorQuery))
      );
    }

    if (filteredFavs.length === 0) {
      this.list.innerHTML = `
        <p style="font-size: 0.8rem; text-align: center; color: var(--text-muted); padding: 20px;">
          No favorites match filter "${this.authorFilter}"
        </p>
      `;
      return;
    }

    filteredFavs.forEach(book => {
      const favItemInstance = new FavoriteItem(book, {
        onRemoveFavorite: this.onRemoveFavorite
      });
      
      this.list.appendChild(favItemInstance.render());
    });
  }
}
