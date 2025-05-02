import { exportAndDownloadMIDI as jzzExportAndDownloadMIDI } from '../jzzMidi.js';
import { exportAndDownloadMIDI as simpleMidiExportAndDownloadMIDI } from '../simpleMidi';
import { generateAndSaveMidiFile } from '../../controllers/MidiFileController';

export const exportAndDownloadMIDI = async (melodyData, chordData, fileName, options = {}) => {
  try {
    if (!melodyData && !chordData) {
      console.error('No data to export');
      return false;
    }

    try {
      const success = await jzzExportAndDownloadMIDI(melodyData, chordData, fileName, options);
      if (success) {
        return true;
      }

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
