/**
 * MIDI Export Utilities
 *
 * Provides functions for exporting MIDI files and saving them to Firebase.
 * Uses the MidiFileController to handle storage operations.
 */

import { exportAndDownloadMIDI as jzzExportAndDownloadMIDI } from '../jzzMidi.js';
import { exportAndDownloadMIDI as simpleMidiExportAndDownloadMIDI } from '../simpleMidi';
import { generateAndSaveMidiFile } from '../../controllers/MidiFileController';

/**
 * Export MIDI file and download it
 * This function delegates to the jzzMidi implementation which handles both
 * generating the MIDI data and triggering the download.
 *
 * @param {Object} melodyData - Melody data
 * @param {Object} chordData - Chord progression data
 * @param {string} fileName - File name
 * @param {Object} options - Export options
 * @returns {Promise<boolean>} - Whether the export was successful
 */
export const exportAndDownloadMIDI = async (melodyData, chordData, fileName, options = {}) => {
  try {
    // Check if we have data to export
    if (!melodyData && !chordData) {
      console.error('No data to export');
      return false;
    }

    // Try to generate MIDI data and download it using JZZ
    try {
      const success = await jzzExportAndDownloadMIDI(melodyData, chordData, fileName, options);
      if (success) {
        return true;
      }

      // If JZZ fails, fall back to simpleMidi
      console.warn('JZZ MIDI export failed, falling back to simpleMidi');
      return await simpleMidiExportAndDownloadMIDI(melodyData, chordData, fileName, options);
    } catch (error) {
      console.error('Error in JZZ MIDI export, falling back to simpleMidi:', error);
      return await simpleMidiExportAndDownloadMIDI(melodyData, chordData, fileName, options);
    }
  } catch (error) {
    console.error('Error exporting MIDI:', error);
    return false;
  }
};

/**
 * Export MIDI file and save it to Firebase
 * @param {Object} melodyData - Melody data
 * @param {Object} chordData - Chord progression data
 * @param {string} fileName - File name
 * @param {Object} options - Export options
 * @param {string} userId - User ID
 * @param {boolean} isPublic - Whether the file is public
 * @returns {Promise<string|null>} - The ID of the saved file or null if failed
 */
export const exportAndSaveMIDI = async (
  melodyData,
  chordData,
  fileName,
  options = {},
  userId,
  isPublic = false
) => {
  try {
    // Check if we have data to export
    if (!melodyData && !chordData) {
      console.error('No data to export');
      return null;
    }

    // Check if user is authenticated
    if (!userId) {
      console.error('User not authenticated');
      return null;
    }

    // Generate and save MIDI file
    const fileId = await generateAndSaveMidiFile(
      melodyData,
      chordData,
      fileName,
      options,
      userId,
      isPublic
    );

    return fileId;
  } catch (error) {
    console.error('Error exporting and saving MIDI:', error);
    return null;
  }
};
