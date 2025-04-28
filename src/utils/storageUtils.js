/**
 * @fileoverview Utility functions for saving and loading data from local storage.
 * This module provides a set of functions to interact with the browser's localStorage API
 * in a safe and consistent manner, with proper error handling and type checking.
 * 
 * @module storageUtils
 * @author MIDI Melody & Chord Generator Team
 */

/**
 * Check if local storage is available in the browser.
 * This function tests if localStorage is accessible by attempting to write and read a test value.
 * 
 * @returns {boolean} - True if localStorage is available and working, false otherwise
 * @example
 * if (isLocalStorageAvailable()) {
 *   // Safe to use localStorage
 * } else {
 *   // Provide alternative storage or show warning
 * }
 */
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Save data to local storage with error handling.
 * This function serializes the data to JSON and stores it in localStorage under the specified key.
 * 
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store (will be serialized to JSON)
 * @returns {boolean} - True if the operation was successful, false otherwise
 * @throws {Error} - Logs error to console but doesn't throw to caller
 * @example
 * const melody = { notes: [...], tempo: 120 };
 * if (saveToLocalStorage('my-melody', melody)) {
 *   console.log('Melody saved successfully');
 * }
 */
export const saveToLocalStorage = (key, data) => {
  if (!isLocalStorageAvailable()) {
    console.error('Local storage is not available');
    return false;
  }

  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error('Error saving to local storage:', error);
    return false;
  }
};

/**
 * Load and parse data from local storage with error handling.
 * This function retrieves data stored under the specified key and parses it from JSON.
 * 
 * @param {string} key - The key to retrieve data from
 * @returns {any|null} - The parsed data if found and valid, null otherwise
 * @throws {Error} - Logs error to console but doesn't throw to caller
 * @example
 * const savedMelody = loadFromLocalStorage('my-melody');
 * if (savedMelody) {
 *   // Use the loaded melody
 * } else {
 *   // Handle case where melody wasn't found
 * }
 */
export const loadFromLocalStorage = (key) => {
  if (!isLocalStorageAvailable()) {
    console.error('Local storage is not available');
    return null;
  }

  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Error loading from local storage:', error);
    return null;
  }
};

/**
 * Retrieve all items from local storage that have a specific prefix in their keys.
 * This function is useful for getting all saved melodies or chord progressions.
 * 
 * @param {string} prefix - The prefix to filter items by (e.g., 'melody', 'chord')
 * @returns {Object} - Object with keys and their parsed values, or empty object if none found
 * @throws {Error} - Logs error to console but doesn't throw to caller
 * @example
 * const savedMelodies = getAllSavedItems('melody');
 * // Returns: { 'melody_my-melody_2023-01-01': {...}, 'melody_another_2023-01-02': {...} }
 */
export const getAllSavedItems = (prefix) => {
  if (!isLocalStorageAvailable()) {
    console.error('Local storage is not available');
    return {};
  }

  try {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        const value = loadFromLocalStorage(key);
        if (value !== null) {
          items[key] = value;
        }
      }
    }
    return items;
  } catch (error) {
    console.error('Error getting saved items:', error);
    return {};
  }
};

/**
 * Remove an item from local storage with error handling.
 * This function safely removes an item from localStorage by its key.
 * 
 * @param {string} key - The key of the item to remove
 * @returns {boolean} - True if the operation was successful, false otherwise
 * @throws {Error} - Logs error to console but doesn't throw to caller
 * @example
 * if (removeFromLocalStorage('melody_old-melody_2023-01-01')) {
 *   console.log('Old melody removed successfully');
 * }
 */
export const removeFromLocalStorage = (key) => {
  if (!isLocalStorageAvailable()) {
    console.error('Local storage is not available');
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from local storage:', error);
    return false;
  }
};

/**
 * Generate a unique key for storing data in local storage.
 * This function creates a key with the format `prefix_name_timestamp` to ensure uniqueness
 * and to make it easy to identify and group related items.
 * 
 * @param {string} prefix - The prefix for the key (e.g., 'melody', 'chord')
 * @param {string} name - The user-provided name for the saved item
 * @returns {string} - A unique key in the format `prefix_name_timestamp`
 * @example
 * // Returns something like: "melody_my-first-melody_2023-05-15T14-30-22-456Z"
 * const key = generateStorageKey('melody', 'my-first-melody');
 * 
 * // If no name is provided, "untitled" is used
 * // Returns something like: "chord_untitled_2023-05-15T14-30-22-456Z"
 * const defaultKey = generateStorageKey('chord');
 */
export const generateStorageKey = (prefix, name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${name || 'untitled'}_${timestamp}`;
};
