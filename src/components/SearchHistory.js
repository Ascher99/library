import { getHistoryIconSvg } from './icons.js';
import { escapeHtml } from '../utils.js';

const STORAGE_KEY = 'lumina_recent_searches';
const MAX_HISTORY_ITEMS = 6;

export class SearchHistory {
  /**
   * @param {HTMLElement} container DOM element to render recent searches into
   * @param {Object} callbacks Event callbacks
   * @param {Function} callbacks.onSelect Triggered when a recent search chip is clicked
   */
  constructor(container, { onSelect } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.history = this.load();
    this.render();
  }

  /**
   * Loads search history from localStorage.
   * @returns {string[]}
   */
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string' && item.trim()) : [];
    } catch (e) {
      console.error('Failed to load search history:', e);
      return [];
    }
  }

  /**
   * Saves search history array to localStorage.
   * @param {string[]} list 
   */
  save(list) {
    this.history = list;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }

  /**
   * Adds a query to search history (deduplicated, newest first, max 6 items).
   * @param {string} query 
   */
  add(query) {
    if (!query || typeof query !== 'string') return;
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    // Filter out previous occurrence (case-insensitive)
    const filtered = this.history.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
    
    // Add to front and limit to max items
    const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    this.save(updated);
    this.render();
  }

  /**
   * Removes a single query from history.
   * @param {string} query 
   */
  remove(query) {
    const updated = this.history.filter(item => item.toLowerCase() !== query.toLowerCase());
    this.save(updated);
    this.render();
  }

  /**
   * Clears all search history.
   */
  clear() {
    this.save([]);
    this.render();
  }

  /**
   * Renders the recent searches chips into the container.
   */
  render() {
    if (!this.container) return;

    if (this.history.length === 0) {
      this.container.hidden = true;
      this.container.innerHTML = '';
      return;
    }

    this.container.hidden = false;

    const chipsHtml = this.history.map(item => `
      <div class="recent-chip" data-query="${escapeHtml(item)}" role="button" tabindex="0" title="Search for '${escapeHtml(item)}'">
        <span class="recent-chip-icon">${getHistoryIconSvg()}</span>
        <span class="recent-chip-text">${escapeHtml(item)}</span>
        <button type="button" class="recent-chip-remove" data-remove="${escapeHtml(item)}" aria-label="Remove '${escapeHtml(item)}' from search history" title="Remove">
          &times;
        </button>
      </div>
    `).join('');

    this.container.innerHTML = `
      <span class="recent-chips-label">Recent:</span>
      <div class="recent-chips-list">
        ${chipsHtml}
      </div>
      <button type="button" class="clear-history-btn" title="Clear all recent searches">Clear</button>
    `;

    // Bind event handlers
    const chipsList = this.container.querySelector('.recent-chips-list');
    if (chipsList) {
      chipsList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.recent-chip-remove');
        if (removeBtn) {
          e.stopPropagation();
          const queryToRemove = removeBtn.getAttribute('data-remove');
          if (queryToRemove) {
            this.remove(queryToRemove);
          }
          return;
        }

        const chip = e.target.closest('.recent-chip');
        if (chip) {
          const query = chip.getAttribute('data-query');
          if (query && this.onSelect) {
            this.onSelect(query);
          }
        }
      });

      // Keyboard accessibility (Enter or Space to select)
      chipsList.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const chip = e.target.closest('.recent-chip');
          if (chip && !e.target.closest('.recent-chip-remove')) {
            e.preventDefault();
            const query = chip.getAttribute('data-query');
            if (query && this.onSelect) {
              this.onSelect(query);
            }
          }
        }
      });
    }

    const clearBtn = this.container.querySelector('.clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clear();
      });
    }
  }
}
