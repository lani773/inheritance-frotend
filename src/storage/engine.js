/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — localStorage Engine
   
   Central abstraction for all browser storage operations.
   All data reads/writes go through this module.
   To swap to sessionStorage or IndexedDB, only change this file.
   ═══════════════════════════════════════════════════════════════════ */

/** Storage key namespace prefix — prevents collisions with other apps */
const NS = 'choir_';

/**
 * Storage engine object — all CRUD operations for localStorage.
 * Handles JSON serialization, error recovery, and namespacing.
 */
const Storage = {

  // ── Read ─────────────────────────────────────────────────────

  /**
   * Get a value from localStorage.
   * @param {string} key - Storage key (without namespace prefix)
   * @param {*} defaultValue - Returned if key doesn't exist or parse fails
   * @returns {*} Parsed value or defaultValue
   */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`[Storage] Failed to read key "${key}":`, error.message);
      return defaultValue;
    }
  },

  // ── Write ────────────────────────────────────────────────────

  /**
   * Save a value to localStorage.
   * @param {string} key - Storage key (without namespace prefix)
   * @param {*} value - Value to store (will be JSON-serialized)
   * @returns {boolean} true if saved successfully, false on error
   */
  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      return true;
    } catch (error) {
      // Possible QuotaExceededError on large datasets
      console.error(`[Storage] Failed to write key "${key}":`, error.message);
      return false;
    }
  },

  // ── Delete ───────────────────────────────────────────────────

  /**
   * Remove a single key from localStorage.
   * @param {string} key - Storage key (without namespace prefix)
   */
  remove(key) {
    try {
      localStorage.removeItem(NS + key);
    } catch (error) {
      console.warn(`[Storage] Failed to remove key "${key}":`, error.message);
    }
  },

  // ── Clear ────────────────────────────────────────────────────

  /**
   * Remove ALL choir app data from localStorage.
   * This resets the entire application to its initial state.
   */
  clearAll() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(NS)) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      console.log(`[Storage] Cleared ${keysToRemove.length} choir data keys`);
    } catch (error) {
      console.error('[Storage] Failed to clear all data:', error.message);
    }
  },

  // ── Utilities ────────────────────────────────────────────────

  /**
   * Check if a key exists in localStorage.
   * @param {string} key - Storage key (without namespace prefix)
   * @returns {boolean}
   */
  has(key) {
    return localStorage.getItem(NS + key) !== null;
  },

  /**
   * Get all choir-related storage keys (without namespace prefix).
   * @returns {string[]} Array of storage keys
   */
  allKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS)) keys.push(k.slice(NS.length));
    }
    return keys;
  },

  /**
   * Get estimated storage usage in KB.
   * @returns {number} Approximate size in KB
   */
  getSizeKB() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NS)) {
        total += (localStorage.getItem(key) || '').length;
      }
    }
    return Math.round(total / 1024);
  },

  // ── Array Helpers ─────────────────────────────────────────────
  // Convenience methods for working with array-typed storage values.

  /**
   * Get a list from storage.
   * @param {string} key
   * @returns {Array}
   */
  getList(key) {
    return this.get(key, []);
  },

  /**
   * Find one item in a stored list by matching predicate.
   * @param {string} key - Storage key
   * @param {Function} predicate - (item) => boolean
   * @returns {*|null}
   */
  findOne(key, predicate) {
    const list = this.getList(key);
    return list.find(predicate) || null;
  },

  /**
   * Add an item to a stored list. Generates `id` if not present.
   * @param {string} key - Storage key
   * @param {object} item - Item to add
   * @returns {object} The stored item (with generated id)
   */
  addToList(key, item) {
    const list = this.getList(key);
    const newItem = {
      ...item,
      id: item.id || Date.now() + Math.floor(Math.random() * 1000),
      createdAt: item.createdAt || new Date().toISOString(),
    };
    this.set(key, [...list, newItem]);
    return newItem;
  },

  /**
   * Update an item in a stored list (matched by `id`).
   * @param {string} key - Storage key
   * @param {number|string} id - Item id
   * @param {object} updates - Fields to merge/update
   * @returns {object|null} Updated item or null if not found
   */
  updateInList(key, id, updates) {
    const list = this.getList(key);
    let updated = null;
    const newList = list.map(item => {
      if (item.id === id) {
        updated = { ...item, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      }
      return item;
    });
    if (updated) this.set(key, newList);
    return updated;
  },

  /**
   * Remove an item from a stored list (matched by `id`).
   * @param {string} key - Storage key
   * @param {number|string} id - Item id
   * @returns {boolean} true if removed, false if not found
   */
  removeFromList(key, id) {
    const list = this.getList(key);
    const filtered = list.filter(item => item.id !== id);
    if (filtered.length < list.length) {
      this.set(key, filtered);
      return true;
    }
    return false;
  },

  /**
   * Get the next available integer ID for a list.
   * @param {string} key - Storage key
   * @returns {number} Next ID
   */
  nextId(key) {
    const list = this.getList(key);
    if (list.length === 0) return 1;
    return Math.max(...list.map(item => item.id || 0)) + 1;
  },
};

export default Storage;

// ── Storage Key Constants ──────────────────────────────────────
// All localStorage key names (without namespace prefix).
// Import these in services to avoid typos.
export const KEYS = {
  INITIALIZED:          'initialized',
  SESSION:              'session',
  REMEMBER:             'remember',
  LOGIN_ATTEMPTS:       'login_attempts',
  MEMBERS:              'members',
  PENDING_REGISTRATIONS:'pending_registrations',
  EVENTS:               'events',
  ATTENDANCE:           'attendance',
  EXCUSES:              'excuses',
  CONTRIBUTIONS:        'contributions',
  MESSAGES:             'messages',
  POSTS:                'posts',
  WELFARE_CASES:        'welfare_cases',
  SONGS:                'songs',
  SETLISTS:             'setlists',
  NOTIFICATIONS:        'notifications',
  SETTINGS:             'settings',
  AUDIT_LOG:            'audit_log',
  PRAYER_REQUESTS:      'prayer_requests',
};
