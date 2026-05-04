/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Custom Hooks
   ═══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';
import Storage from '../storage/engine';

/* ── useLocalStorage ──────────────────────────────────────────── */
/**
 * Like useState, but synced to localStorage.
 * Changes persist across page reloads.
 *
 * @param {string} key - localStorage key (without namespace)
 * @param {*} initialValue - Default value if key doesn't exist
 * @returns {[value, setValue]} Tuple like useState
 *
 * @example
 * const [members, setMembers] = useLocalStorage('members', []);
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => Storage.get(key, initialValue));

  const setStoredValue = useCallback((newValue) => {
    const val = typeof newValue === 'function' ? newValue(value) : newValue;
    setValue(val);
    Storage.set(key, val);
  }, [key, value]);

  // Sync from storage if another tab changes it
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === `choir_${key}`) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch {
          setValue(initialValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, initialValue]);

  return [value, setStoredValue];
}

/* ── useDebounce ──────────────────────────────────────────────── */
/**
 * Returns a debounced version of the value.
 * Useful for search inputs — prevents querying on every keystroke.
 *
 * @param {*} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default 300ms)
 * @returns {*} Debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchText, 300);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/* ── usePrevious ──────────────────────────────────────────────── */
/**
 * Returns the previous value of a variable.
 * @param {*} value
 * @returns {*} Previous value
 */
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; });
  return ref.current;
}

/* ── useOnClickOutside ────────────────────────────────────────── */
/**
 * Fires a callback when the user clicks outside the given ref element.
 * Useful for closing dropdowns, modals, etc.
 *
 * @param {React.RefObject} ref - Ref to the element
 * @param {Function} handler - Called when click outside occurs
 *
 * @example
 * const dropdownRef = useRef();
 * useOnClickOutside(dropdownRef, () => setIsOpen(false));
 */
export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

/* ── useKeyboard ──────────────────────────────────────────────── */
/**
 * Listen for keyboard shortcuts.
 * @param {Object} shortcuts - { 'Escape': handler, 'Meta+k': handler }
 *
 * @example
 * useKeyboard({
 *   'Escape': () => setModalOpen(false),
 *   'Meta+k': () => setCommandOpen(true),
 * });
 */
export function useKeyboard(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      const parts = [];
      if (e.metaKey || e.ctrlKey) parts.push('Meta');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');
      parts.push(e.key);

      const combo = parts.join('+');
      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo](e);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

/* ── useWindowSize ────────────────────────────────────────────── */
/**
 * Returns the current window dimensions.
 * @returns {{ width: number, height: number }}
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}

/* ── useToggle ────────────────────────────────────────────────── */
/**
 * Simple boolean toggle hook.
 * @param {boolean} initial - Initial value
 * @returns {[boolean, Function]} [value, toggle]
 */
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

/* ── useAsync ─────────────────────────────────────────────────── */
/**
 * Handle async operations with loading/error state.
 * @param {Function} asyncFn - Async function to execute
 * @returns {{ execute, loading, error, data }}
 *
 * @example
 * const { execute: saveData, loading, error } = useAsync(membersService.create);
 * await execute(memberFormData);
 */
export function useAsync(asyncFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { execute, loading, error, data };
}
