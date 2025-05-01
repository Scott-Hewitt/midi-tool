/**
 * Backup and Export Utilities
 *
 * This module provides utilities for backing up and exporting user data.
 */

import { getUserMidiFiles } from '../models/MidiFileModel';
import { getUserFavorites } from '../models/FavoriteModel';
import { getUserById } from '../models/UserModel';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Export all user MIDI files as a zip archive
 * @param {string} userId - User ID
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export const exportAllMidiFiles = async (userId, options = {}) => {
  try {
    const { includeMetadata = true } = options;

    // Get all user MIDI files
    const files = await getUserMidiFiles(userId);

    if (files.length === 0) {
      throw new Error('No MIDI files found to export.');
    }

    // Create a new zip archive
    const zip = new JSZip();

    // Add each MIDI file to the archive
    for (const file of files) {
      // Fetch the MIDI file data
      const response = await fetch(file.downloadURL);
      const midiData = await response.arrayBuffer();

      // Add the MIDI file to the zip
      zip.file(`${file.fileName}.mid`, midiData);

      // Add metadata if requested
      if (includeMetadata) {
        const metadata = {
          id: file.id,
          fileName: file.fileName,
          type: file.type,
          key: file.key,
          tempo: file.tempo,
          bars: file.bars,
          isPublic: file.isPublic,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        };

        zip.file(`${file.fileName}.json`, JSON.stringify(metadata, null, 2));
      }
    }

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Save the zip file
    saveAs(zipBlob, `midi-files-backup-${new Date().toISOString().slice(0, 10)}.zip`);

    return {
      success: true,
      message: `Successfully exported ${files.length} MIDI files.`,
    };
  } catch (error) {
    console.error('Error exporting MIDI files:', error);
    throw error;
  }
};

/**
 * Export user data as JSON
 * @param {string} userId - User ID
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export const exportUserData = async (userId, options = {}) => {
  try {
    const { includeProfile = true, includeMidiFiles = true, includeFavorites = true } = options;

    const userData = {};

    // Get user profile
    if (includeProfile) {
      const profile = await getUserById(userId);
      if (profile) {
        userData.profile = profile;
      }
    }

    // Get MIDI files
    if (includeMidiFiles) {
      const files = await getUserMidiFiles(userId);
      userData.midiFiles = files.map(file => ({
        id: file.id,
        fileName: file.fileName,
        type: file.type,
        key: file.key,
        tempo: file.tempo,
        bars: file.bars,
        isPublic: file.isPublic,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      }));
    }

    // Get favorites
    if (includeFavorites) {
      const favorites = await getUserFavorites(userId);
      userData.favorites = favorites.map(fav => ({
        id: fav.id,
        fileId: fav.fileId,
        favoritedAt: fav.favoritedAt,
      }));
    }

    // Convert to JSON
    const jsonData = JSON.stringify(userData, null, 2);

    // Create a blob
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Save the file
    saveAs(blob, `user-data-backup-${new Date().toISOString().slice(0, 10)}.json`);

    return {
      success: true,
      message: 'Successfully exported user data.',
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
};

/**
 * Import user data from JSON
 * @param {File} file - JSON file
 * @param {string} userId - User ID
 * @param {Object} options - Import options
 * @returns {Promise<Object>} - Import results
 */
export const importUserData = async (file, userId, options = {}) => {
  try {
    const {
      importProfile = false,
      importMidiFiles = true,
      importFavorites = true,
      // overwriteExisting option is reserved for future implementation
      // overwriteExisting = false,
    } = options;

    // Read the file
    const fileReader = new FileReader();

    const fileContents = await new Promise((resolve, reject) => {
      fileReader.onload = event => resolve(event.target.result);
      fileReader.onerror = error => reject(error);
      fileReader.readAsText(file);
    });

    // Parse the JSON
    const userData = JSON.parse(fileContents);

    const results = {
      profile: { success: false, message: 'Profile import skipped.' },
      midiFiles: { success: false, message: 'MIDI files import skipped.' },
      favorites: { success: false, message: 'Favorites import skipped.' },
    };

    // Import profile
    if (importProfile && userData.profile) {
      // This is typically not recommended as it could overwrite important user data
      // Implement with caution
      results.profile = {
        success: false,
        message: 'Profile import not implemented for security reasons.',
      };
    }

    // Import MIDI files
    if (importMidiFiles && userData.midiFiles && userData.midiFiles.length > 0) {
      // This would require re-uploading the MIDI files to Firebase Storage
      // and creating new Firestore documents
      // For simplicity, we'll just return a message
      results.midiFiles = {
        success: false,
        message: `Found ${userData.midiFiles.length} MIDI files to import. Please use the MIDI file import feature instead.`,
      };
    }

    // Import favorites
    if (importFavorites && userData.favorites && userData.favorites.length > 0) {
      // This would require checking if the files exist and adding them to favorites
      // For simplicity, we'll just return a message
      results.favorites = {
        success: false,
        message: `Found ${userData.favorites.length} favorites to import. Please use the favorites import feature instead.`,
      };
    }

    return {
      success: false,
      message:
        'Import functionality is not fully implemented. Please use the specific import features instead.',
      results,
    };
  } catch (error) {
    console.error('Error importing user data:', error);
    throw error;
  }
};
