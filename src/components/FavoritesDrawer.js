import { FavoriteItem } from './FavoriteItem.js';
import { debounce } from '../utils.js';
import { exportFavoritesJSON, exportFavoritesMarkdown, importFavoritesJSON, getReadingGoal, setReadingGoal, getReadingStats } from '../favorites.js';

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
   * @param {HTMLElement} [elements.readingGoalWidget] Container for personal reading goal progress
   * @param {HTMLElement} elements.emptyMsg The empty message container
   * @param {HTMLElement} elements.list The favorites list items container
   * @param {HTMLElement} [elements.exportBtn] Button to trigger JSON export
   * @param {HTMLElement} [elements.exportMdBtn] Button to trigger Markdown export
   * @param {HTMLElement} [elements.importBtn] Button to trigger JSON import
   * @param {HTMLInputElement} [elements.importInput] Hidden file input element
   * @param {HTMLElement} [elements.toastContainer] Toast message banner container
   * @param {Object} callbacks Event callbacks
   * @param {Function} callbacks.onRemoveFavorite Triggered when removing a book
   * @param {Function} callbacks.onSelectBook Triggered when clicking a favorited item
   * @param {Function} [callbacks.onImportSuccess] Triggered when books are imported successfully
   */
  constructor(
    { section, badgeSubtitle, fabBadge, closeBtn, toggleFab, filterContainer, filterInput, statusTabsContainer, statsBar, readingGoalWidget, emptyMsg, list, exportBtn, exportMdBtn, importBtn, importInput, toastContainer },
    { onRemoveFavorite, onSelectBook, onImportSuccess }
  ) {
    this.section = section;
    this.badgeSubtitle = badgeSubtitle;
    this.fabBadge = fabBadge;
    this.closeBtn = closeBtn;
    this.toggleFab = toggleFab;
    this.filterContainer = filterContainer;
    this.filterInput = filterInput;
    this.statusTabsContainer = statusTabsContainer;
    this.statsBar = statsBar;
    this.readingGoalWidget = readingGoalWidget;
    this.emptyMsg = emptyMsg;
    this.list = list;
    this.exportBtn = exportBtn;
    this.exportMdBtn = exportMdBtn;
    this.importBtn = importBtn;
    this.importInput = importInput;
    this.toastContainer = toastContainer;

    this.onRemoveFavorite = onRemoveFavorite;
    this.onSelectBook = onSelectBook;
    this.onImportSuccess = onImportSuccess;
    
    this.favorites = [];
    this.authorFilter = '';
    this.activeStatusTab = 'all';
    this.drawerOverlay = null;
    this.toastTimeout = null;

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

    // Status filter tabs navigation
    if (this.statusTabsContainer) {
      this.statusTabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.fav-tab');
        if (!btn) return;
        const targetTab = btn.getAttribute('data-tab');
        this.activeStatusTab = targetTab;
        this.statusTabsContainer.querySelectorAll('.fav-tab').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        this.render();
      });
    }

    // Filter input typing (debounced)
    const handleFilterInput = debounce((e) => {
      this.authorFilter = e.target.value;
      this.render();
    }, 150);

    this.filterInput.addEventListener('input', handleFilterInput);

    // Export Action
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => {
        if (this.favorites.length === 0) {
          this.showToast('No favorites to export.', 'error');
          return;
        }
        exportFavoritesJSON();
        this.showToast(`Exported ${this.favorites.length} favorite book(s)!`, 'success');
      });
    }

    // Export Markdown Action
    if (this.exportMdBtn) {
      this.exportMdBtn.addEventListener('click', () => {
        if (this.favorites.length === 0) {
          this.showToast('No favorites to export.', 'error');
          return;
        }
        exportFavoritesMarkdown();
        this.showToast(`Exported ${this.favorites.length} book(s) to Markdown!`, 'success');
      });
    }

    // Import Action
    if (this.importBtn && this.importInput) {
      this.importBtn.addEventListener('click', () => {
        this.importInput.click();
      });

      this.importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = importFavoritesJSON(event.target.result);
          if (res.success) {
            this.showToast(`Imported ${res.addedCount} new book(s) (${res.totalCount} total)`, 'success');
            if (typeof this.onImportSuccess === 'function') {
              this.onImportSuccess();
            }
          } else {
            this.showToast(res.error || 'Failed to import favorites.', 'error');
          }
          this.importInput.value = '';
        };
        reader.onerror = () => {
          this.showToast('Error reading file.', 'error');
          this.importInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    // Handle screen resize, auto close on desktop view
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        this.toggle(true);
      }
    });
  }

  /**
   * Displays inline feedback toast message in favorites drawer.
   * @param {string} message Message text
   * @param {'success'|'error'} type Type of notification
   */
  showToast(message, type = 'success') {
    if (!this.toastContainer) return;
    this.toastContainer.textContent = message;
    this.toastContainer.className = `favorites-toast ${type}`;
    this.toastContainer.hidden = false;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastContainer.hidden = true;
    }, 4000);
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

    const stats = getReadingStats();

    if (this.statsBar) {
      this.statsBar.innerHTML = `
        <span class="stat-pill" title="${stats.reading} currently reading">📖 ${stats.reading} Reading</span>
        <span class="stat-pill" title="${stats.completed} completed books">✓ ${stats.completed} Done</span>
        ${stats.wantToRead ? `<span class="stat-pill" title="${stats.wantToRead} planned to read">📌 ${stats.wantToRead} To Read</span>` : ''}
        ${stats.avgRating ? `<span class="stat-pill highlight" title="Average rating across rated books">★ ${stats.avgRating} avg</span>` : ''}
      `;
    }

    // Render Reading Goal & Statistics Widget
    if (this.readingGoalWidget) {
      const { completed, targetGoal, progressPct, milestones } = stats;
      const radius = 18;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (progressPct / 100) * circumference;

      const milestonesHTML = milestones.length > 0 ? `
        <div class="milestones-row">
          ${milestones.map(m => `
            <span class="milestone-badge" title="${m.label}: ${m.desc}">
              <span class="milestone-icon">${m.icon}</span>
              <span class="milestone-text">${m.label}</span>
            </span>
          `).join('')}
        </div>
      ` : '';

      this.readingGoalWidget.innerHTML = `
        <div class="goal-card-header">
          <div class="goal-title-group">
            <span class="goal-title">🎯 Reading Tracker</span>
            <button class="goal-edit-btn" title="Set custom target reading goal">✏️ Edit Goal</button>
          </div>
          <div class="goal-controls">
            <button class="goal-btn goal-minus" title="Decrease target goal" ${targetGoal <= 1 ? 'disabled' : ''}>-</button>
            <span class="goal-numbers"><strong>${completed}</strong> / ${targetGoal} books</span>
            <button class="goal-btn goal-plus" title="Increase target goal">+</button>
          </div>
        </div>

        <div class="goal-progress-section">
          <div class="goal-ring-container">
            <svg class="goal-ring-svg" width="48" height="48" viewBox="0 0 48 48">
              <circle class="goal-ring-bg" cx="24" cy="24" r="${radius}" stroke-width="4" />
              <circle class="goal-ring-fill" cx="24" cy="24" r="${radius}" stroke-width="4"
                      style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};" />
            </svg>
            <span class="goal-ring-text">${progressPct}%</span>
          </div>

          <div class="goal-progress-details">
            <div class="goal-bar-track" title="${progressPct}% of goal completed">
              <div class="goal-bar-fill" style="width: ${progressPct}%;"></div>
            </div>
            <p class="goal-insight-text">
              ${completed >= targetGoal
                ? '🎉 <strong>Goal Achieved!</strong> Outstanding reading milestone!'
                : `Target: ${targetGoal} books. <strong>${Math.max(0, targetGoal - completed)}</strong> more to reach your goal!`
              }
            </p>
          </div>
        </div>

        ${milestonesHTML}
      `;

      const minusBtn = this.readingGoalWidget.querySelector('.goal-minus');
      const plusBtn = this.readingGoalWidget.querySelector('.goal-plus');
      const editBtn = this.readingGoalWidget.querySelector('.goal-edit-btn');

      if (minusBtn) {
        minusBtn.addEventListener('click', () => {
          setReadingGoal(targetGoal - 1);
          this.render();
        });
      }

      if (plusBtn) {
        plusBtn.addEventListener('click', () => {
          setReadingGoal(targetGoal + 1);
          this.render();
        });
      }

      if (editBtn) {
        editBtn.addEventListener('click', () => {
          const input = prompt('Enter your target reading goal count (e.g. 12, 25, 50):', targetGoal);
          if (input !== null) {
            const num = parseInt(input, 10);
            if (!isNaN(num) && num > 0) {
              setReadingGoal(num);
              this.render();
            }
          }
        });
      }
    }

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

    // Status Tab Filtering
    if (this.activeStatusTab !== 'all') {
      filteredFavs = filteredFavs.filter(book => (book.readingStatus || 'want_to_read') === this.activeStatusTab);
    }

    // Author Text Query Filtering
    if (this.authorFilter.trim()) {
      const authorQuery = this.authorFilter.toLowerCase().trim();
      filteredFavs = filteredFavs.filter(book =>
        book.authors.some(author => author.toLowerCase().includes(authorQuery))
      );
    }

    if (filteredFavs.length === 0) {
      this.list.innerHTML = `
        <div class="fav-filter-empty">
          <p>No favorite books found in this view.</p>
          ${this.authorFilter ? `<span class="filter-hint">Matching author query: "${this.authorFilter}"</span>` : ''}
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    filteredFavs.forEach(book => {
      const favItemInstance = new FavoriteItem(book, {
        onRemoveFavorite: this.onRemoveFavorite,
        onSelectBook: this.onSelectBook
      });
      
      fragment.appendChild(favItemInstance.render());
    });
    this.list.appendChild(fragment);
  }
}


