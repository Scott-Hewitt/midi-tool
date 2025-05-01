/**
 * MIDI Export Utilities
 *
 * Provides functions for exporting MIDI files and saving them to Firebase.
 */

import { saveMidiFileToStorage } from '../controllers/MidiFileController';

/**
 * Export MIDI file and save it to Firebase
 * @param {Uint8Array} midiData - MIDI file data
 * @param {string} fileName - File name
 * @param {Object} metadata - File metadata
 * @param {string} userId - User ID
 * @param {boolean} isPublic - Whether the file is public
 * @returns {Promise<string|null>} - The ID of the saved file or null if failed
 */
export const saveMidiFile = async (midiData, fileName, metadata, userId, isPublic = false) => {
  try {
    // Check if we have data to export
    if (!midiData) {
      console.error('No MIDI data to save');
      return null;
    }

    // Check if user is authenticated
    if (!userId) {
      console.error('User not authenticated');
      return null;
    }

    // Save MIDI file
    const fileId = await saveMidiFileToStorage(midiData, fileName, metadata, userId, isPublic);

    return fileId;
  } catch (error) {
    console.error('Error saving MIDI file:', error);
    return null;
  }
};
