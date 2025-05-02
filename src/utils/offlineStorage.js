const DB_NAME = 'midi_generator_offline_db';
const DB_VERSION = 1;

const STORES = {
  MIDI_FILES: 'midiFiles',
  PENDING_UPLOADS: 'pendingUploads',
  USER_SETTINGS: 'userSettings',
  COMPOSITIONS: 'compositions',
};

export const initDatabase = () =>
  new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(
        new Error("Your browser doesn't support IndexedDB. Offline functionality will be limited.")
      );
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB database.'));
    };

    request.onsuccess = event => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = event => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.MIDI_FILES)) {
        const midiFilesStore = db.createObjectStore(STORES.MIDI_FILES, { keyPath: 'id' });
        midiFilesStore.createIndex('userId', 'userId', { unique: false });
        midiFilesStore.createIndex('isPublic', 'isPublic', { unique: false });
        midiFilesStore.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_UPLOADS)) {
        const pendingUploadsStore = db.createObjectStore(STORES.PENDING_UPLOADS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        pendingUploadsStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
        db.createObjectStore(STORES.USER_SETTINGS, { keyPath: 'userId' });
      }

      if (!db.objectStoreNames.contains(STORES.COMPOSITIONS)) {
        const compositionsStore = db.createObjectStore(STORES.COMPOSITIONS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        compositionsStore.createIndex('userId', 'userId', { unique: false });
        compositionsStore.createIndex('type', 'type', { unique: false });
      }
    };
  });

export const saveMidiFileOffline = async midiFile => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.MIDI_FILES], 'readwrite');
      const store = transaction.objectStore(STORES.MIDI_FILES);

      // Generate a temporary ID if not provided
      if (!midiFile.id) {
        midiFile.id = 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }

      // Add offline flag
      midiFile.isOffline = true;
      midiFile.pendingSync = true;

      // Add timestamps if not present
      if (!midiFile.createdAt) {
        midiFile.createdAt = new Date().toISOString();
      }
      midiFile.updatedAt = new Date().toISOString();

      const request = store.put(midiFile);

      request.onsuccess = () => {
        resolve(midiFile.id);
      };

      request.onerror = () => {
        reject(new Error('Failed to save MIDI file offline.'));
      };
    });
  } catch (error) {
    console.error('Error saving MIDI file offline:', error);
    throw error;
  }
};

export const getUserMidiFilesOffline = async userId => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.MIDI_FILES], 'readonly');
      const store = transaction.objectStore(STORES.MIDI_FILES);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get user MIDI files offline.'));
      };
    });
  } catch (error) {
    console.error('Error getting user MIDI files offline:', error);
    throw error;
  }
};

export const getPublicMidiFilesOffline = async () => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.MIDI_FILES], 'readonly');
      const store = transaction.objectStore(STORES.MIDI_FILES);
      const index = store.index('isPublic');
      const request = index.getAll(true);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get public MIDI files offline.'));
      };
    });
  } catch (error) {
    console.error('Error getting public MIDI files offline:', error);
    throw error;
  }
};

/**
 * Delete a MIDI file from IndexedDB
 * @param {string} fileId - File ID
 * @param {string} userId - User ID for authorization
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export const deleteMidiFileOffline = async (fileId, userId) => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.MIDI_FILES], 'readwrite');
      const store = transaction.objectStore(STORES.MIDI_FILES);

      // First get the file to check ownership
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const file = getRequest.result;

        if (!file) {
          reject(new Error('File not found.'));
          return;
        }

        if (file.userId !== userId) {
          reject(new Error('Unauthorized.'));
          return;
        }

        // Delete the file
        const deleteRequest = store.delete(fileId);

        deleteRequest.onsuccess = () => {
          resolve(true);
        };

        deleteRequest.onerror = () => {
          reject(new Error('Failed to delete MIDI file offline.'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get MIDI file for deletion.'));
      };
    });
  } catch (error) {
    console.error('Error deleting MIDI file offline:', error);
    throw error;
  }
};

/**
 * Save a composition draft to IndexedDB
 * @param {Object} composition - Composition object
 * @param {string} userId - User ID
 * @returns {Promise<string>} - The ID of the saved composition
 */
export const saveCompositionDraft = async (composition, userId) => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.COMPOSITIONS], 'readwrite');
      const store = transaction.objectStore(STORES.COMPOSITIONS);

      // Add user ID and timestamps
      composition.userId = userId;
      composition.createdAt = composition.createdAt || new Date().toISOString();
      composition.updatedAt = new Date().toISOString();

      const request = store.put(composition);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to save composition draft.'));
      };
    });
  } catch (error) {
    console.error('Error saving composition draft:', error);
    throw error;
  }
};

/**
 * Get user's composition drafts from IndexedDB
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of composition drafts
 */
export const getUserCompositionDrafts = async userId => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.COMPOSITIONS], 'readonly');
      const store = transaction.objectStore(STORES.COMPOSITIONS);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get composition drafts.'));
      };
    });
  } catch (error) {
    console.error('Error getting composition drafts:', error);
    throw error;
  }
};

/**
 * Add a pending upload to IndexedDB
 * @param {Object} uploadData - Upload data
 * @returns {Promise<number>} - The ID of the pending upload
 */
export const addPendingUpload = async uploadData => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_UPLOADS], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_UPLOADS);

      // Add timestamp
      uploadData.createdAt = new Date().toISOString();

      const request = store.add(uploadData);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to add pending upload.'));
      };
    });
  } catch (error) {
    console.error('Error adding pending upload:', error);
    throw error;
  }
};

export const getPendingUploads = async userId => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_UPLOADS], 'readonly');
      const store = transaction.objectStore(STORES.PENDING_UPLOADS);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get pending uploads.'));
      };
    });
  } catch (error) {
    console.error('Error getting pending uploads:', error);
    throw error;
  }
};

/**
 * Remove a pending upload from IndexedDB
 * @param {number} uploadId - Upload ID
 * @returns {Promise<boolean>} - Whether the removal was successful
 */
export const removePendingUpload = async uploadId => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_UPLOADS], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_UPLOADS);
      const request = store.delete(uploadId);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to remove pending upload.'));
      };
    });
  } catch (error) {
    console.error('Error removing pending upload:', error);
    throw error;
  }
};

/**
 * Save user settings to IndexedDB
 * @param {string} userId - User ID
 * @param {Object} settings - User settings
 * @returns {Promise<boolean>} - Whether the save was successful
 */
export const saveUserSettings = async (userId, settings) => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORES.USER_SETTINGS);

      // Add user ID and timestamp
      settings.userId = userId;
      settings.updatedAt = new Date().toISOString();

      const request = store.put(settings);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to save user settings.'));
      };
    });
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
};

/**
 * Get user settings from IndexedDB
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - User settings or null if not found
 */
export const getUserSettings = async userId => {
  try {
    const db = await initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_SETTINGS], 'readonly');
      const store = transaction.objectStore(STORES.USER_SETTINGS);
      const request = store.get(userId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get user settings.'));
      };
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};
