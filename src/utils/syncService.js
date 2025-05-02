import { getPendingUploads, removePendingUpload, getUserMidiFilesOffline } from './offlineStorage';
import { saveMidiFile } from '../models/MidiFileModel';
import { logError } from './errorHandling';

let isOnline = navigator.onLine;

/**
 * Initialize the sync service
 * @param {Function} toast - Toast function for notifications
 */
export const initSyncService = toast => {
  // Set up online/offline event listeners
  window.addEventListener('online', () => {
    isOnline = true;
    if (toast) {
      toast({
        title: 'You are back online',
        description: 'Syncing your offline changes...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
    syncPendingUploads();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    if (toast) {
      toast({
        title: 'You are offline',
        description: 'Changes will be saved locally and synced when you reconnect.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  });

  // Initial sync if online
  if (isOnline) {
    syncPendingUploads();
  }
};

export const checkOnlineStatus = () => isOnline;

export const syncPendingUploads = async () => {
  if (!isOnline) {
    return;
  }

  try {
    // Get all pending uploads for all users
    // In a real app, you might want to limit this to the current user
    const pendingUploads = await getPendingUploads();

    if (pendingUploads.length === 0) {
      return;
    }

    console.log(`Syncing ${pendingUploads.length} pending uploads...`);

    // Process each pending upload
    for (const upload of pendingUploads) {
      try {
        // Different handling based on upload type
        switch (upload.type) {
          case 'midiFile':
            await syncMidiFile(upload);
            break;
          case 'favorite':
            await syncFavorite(upload);
            break;
          case 'userSettings':
            await syncUserSettings(upload);
            break;
          default:
            console.warn(`Unknown upload type: ${upload.type}`);
        }

        // Remove the pending upload after successful sync
        await removePendingUpload(upload.id);
      } catch (error) {
        logError(`Syncing upload ${upload.id}`, error);
        // We don't remove the pending upload if it fails
        // It will be retried next time
      }
    }

    console.log('Sync completed');
  } catch (error) {
    logError('syncPendingUploads', error);
  }
};

/**
 * Sync a MIDI file with Firebase
 * @param {Object} upload - Upload data
 * @returns {Promise<void>}
 */
const syncMidiFile = async upload => {
  const { midiData, fileName, metadata, userId, isPublic } = upload.data;

  // Save to Firebase
  await saveMidiFile(midiData, fileName, metadata, userId, isPublic);
};

/**
 * Sync a favorite with Firebase
 * @param {Object} upload - Upload data
 * @returns {Promise<void>}
 */
const syncFavorite = async upload => {
  const { userId, fileId, action } = upload.data;

  // Import dynamically to avoid circular dependencies
  const { addToFavorites, removeFromFavorites } = await import('../models/FavoriteModel');

  if (action === 'add') {
    await addToFavorites(userId, fileId);
  } else if (action === 'remove') {
    await removeFromFavorites(userId, fileId);
  }
};

/**
 * Sync user settings with Firebase
 * @param {Object} upload - Upload data
 * @returns {Promise<void>}
 */
const syncUserSettings = async upload => {
  const { userId, settings } = upload.data;

  // Import dynamically to avoid circular dependencies
  const { updateUserProfile } = await import('../models/UserModel');

  await updateUserProfile(userId, settings);
};

/**
 * Sync offline MIDI files with Firebase
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const syncOfflineMidiFiles = async userId => {
  if (!isOnline || !userId) {
    return;
  }

  try {
    // Get offline MIDI files
    const offlineFiles = await getUserMidiFilesOffline(userId);

    // Filter files that need syncing
    const filesToSync = offlineFiles.filter(file => file.pendingSync);

    if (filesToSync.length === 0) {
      return;
    }

    console.log(`Syncing ${filesToSync.length} offline MIDI files...`);

    // Process each file
    for (const file of filesToSync) {
      try {
        // Save to Firebase
        await saveMidiFile(
          file.midiData,
          file.fileName,
          {
            type: file.type,
            tempo: file.tempo,
            key: file.key,
            bars: file.bars,
            exportOptions: file.exportOptions,
          },
          userId,
          file.isPublic
        );

        // Update the offline file to mark it as synced
        file.pendingSync = false;

        // Import dynamically to avoid circular dependencies
        const { saveMidiFileOffline } = await import('./offlineStorage');
        await saveMidiFileOffline(file);
      } catch (error) {
        logError(`Syncing offline file ${file.id}`, error);
      }
    }

    console.log('Offline files sync completed');
  } catch (error) {
    logError('syncOfflineMidiFiles', error);
  }
};
