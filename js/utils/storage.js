// js/utils/storage.js

/**
 * Storage Utility
 * Abstracting localStorage to allow for easier testing or changing storage medium (e.g., sessionStorage or IndexedDB)
 */
export const storage = {
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.error("Error saving to localStorage", err);
    }
  },

  get(key) {
    try {
      const serialized = localStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (err) {
      console.error("Error reading from localStorage", err);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};
