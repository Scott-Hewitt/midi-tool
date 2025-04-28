/**
 * @fileoverview Component for displaying and managing saved content from local storage.
 * This component provides a UI for viewing, loading, and deleting saved melodies and chord progressions.
 * 
 * @module SavedContent
 * @requires react
 * @requires ../utils/storageUtils
 */

import { useState, useEffect } from 'react';
import { 
  isLocalStorageAvailable, 
  getAllSavedItems, 
  loadFromLocalStorage, 
  removeFromLocalStorage 
} from '../utils/storageUtils';

/**
 * Component for displaying and managing saved content
 * @param {Object} props - Component props
 * @param {string} props.contentType - Type of content ('melody' or 'chord')
 * @param {Function} props.onLoad - Callback function when content is loaded
 * @param {Function} props.onClose - Callback function when the component is closed
 */
function SavedContent({ contentType, onLoad, onClose }) {
  const [savedItems, setSavedItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Prefix for storage keys
  const prefix = contentType === 'melody' ? 'melody' : 'chord';

  // Load saved items on component mount
  useEffect(() => {
    const loadSavedItems = () => {
      setIsLoading(true);
      setError(null);

      // Check if local storage is available
      const available = isLocalStorageAvailable();
      setStorageAvailable(available);

      if (!available) {
        setError('Local storage is not available in your browser. Saved content cannot be accessed.');
        setIsLoading(false);
        return;
      }

      try {
        const items = getAllSavedItems(prefix);
        setSavedItems(items);
      } catch (err) {
        setError(`Error loading saved ${contentType}s: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedItems();
  }, [contentType, prefix]);

  /**
   * Handle loading a saved item from local storage
   * @param {string} key - The storage key of the item to load
   * @throws {Error} - Caught internally and displayed to user
   */
  const handleLoad = (key) => {
    try {
      const data = loadFromLocalStorage(key);
      if (data) {
        onLoad(data);
      } else {
        setError(`Failed to load ${contentType}. The data may be corrupted.`);
      }
    } catch (err) {
      setError(`Error loading ${contentType}: ${err.message}`);
    }
  };

  /**
   * Handle deleting a saved item from local storage
   * @param {string} key - The storage key of the item to delete
   * @param {Event} event - The click event
   * @throws {Error} - Caught internally and displayed to user
   */
  const handleDelete = (key, event) => {
    // Stop event propagation to prevent triggering the load handler
    event.stopPropagation();

    try {
      const success = removeFromLocalStorage(key);
      if (success) {
        // Update the saved items list
        const updatedItems = { ...savedItems };
        delete updatedItems[key];
        setSavedItems(updatedItems);
      } else {
        setError(`Failed to delete ${contentType}.`);
      }
    } catch (err) {
      setError(`Error deleting ${contentType}: ${err.message}`);
    }
  };

  /**
   * Extract name and date from a storage key
   * @param {string} key - The storage key to parse (format: prefix_name_timestamp)
   * @returns {Object} - Object containing name and formatted date
   * @property {string} name - The name part of the key
   * @property {string} date - The formatted date from the timestamp
   */
  const parseKey = (key) => {
    const parts = key.split('_');
    if (parts.length < 3) return { name: 'Unknown', date: 'Unknown' };

    const name = parts[1];
    // Extract date from the timestamp part
    const timestamp = parts.slice(2).join('_').replace(/-/g, ':');
    const date = new Date(timestamp).toLocaleString();

    return { name, date };
  };

  return (
    <div className="saved-content" role="dialog" aria-labelledby="saved-content-title">
      <div className="saved-content-header">
        <h3 id="saved-content-title">Saved {contentType === 'melody' ? 'Melodies' : 'Chord Progressions'}</h3>
        <button 
          className="close-button" 
          onClick={onClose}
          aria-label="Close saved content panel"
        >
          &times;
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {!storageAvailable && (
        <div className="warning-message" role="alert">
          Local storage is not available in your browser. You won't be able to save or load content.
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">Loading saved content...</div>
      ) : Object.keys(savedItems).length === 0 ? (
        <div className="empty-message">
          No saved {contentType === 'melody' ? 'melodies' : 'chord progressions'} found.
        </div>
      ) : (
        <ul className="saved-items-list" role="list">
          {Object.entries(savedItems).map(([key, item]) => {
            const { name, date } = parseKey(key);
            return (
              <li 
                key={key} 
                className="saved-item"
                onClick={() => handleLoad(key)}
                role="listitem"
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleLoad(key);
                  }
                }}
              >
                <div className="saved-item-info">
                  <div className="saved-item-name">{name}</div>
                  <div className="saved-item-date">{date}</div>
                </div>
                <button 
                  className="delete-button"
                  onClick={(e) => handleDelete(key, e)}
                  aria-label={`Delete ${name}`}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SavedContent;
