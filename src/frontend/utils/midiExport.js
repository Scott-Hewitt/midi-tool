/**
 * MIDI Export Utilities for Frontend
 *
 * Provides functions for exporting MIDI files and saving them to Firebase.
 * This is a frontend wrapper around the backend MIDI export functionality.
 */

import { exportMIDIWithJZZ } from '../../utils/jzzMidi.js';
import { saveMidiFile } from '../../backend/utils/midiExport';

/**
 * Export MIDI file and download it
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

    // Generate MIDI data
    const midiData = await exportMIDIWithJZZ(melodyData, chordData, options);

    if (!midiData) {
      console.error('Failed to generate MIDI data');
      return false;
    }

    // Create a Blob from the MIDI data
    const midiBlob = new Blob([midiData], { type: 'audio/midi' });

    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(midiBlob);
    downloadLink.download = `${fileName}.mid`;
    downloadLink.style.display = 'none'; // Hide the link

    // Trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href); // Free up memory
    }, 100);

    return true;
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

    // Generate MIDI data
    const midiData = await exportMIDIWithJZZ(melodyData, chordData, options);

    if (!midiData) {
      throw new Error('Failed to generate MIDI data');
    }

    // Determine the type of composition
    let type = 'unknown';
    if (melodyData && !chordData) {
      type = 'melody';
    } else if (!melodyData && chordData) {
      type = 'chord';
    } else if (melodyData && chordData) {
      type = 'composition';
    }

    // Prepare metadata
    const metadata = {
      type,
      tempo: melodyData?.tempo || chordData?.tempo || 120,
      key: melodyData?.scale || chordData?.key || 'C',
      bars: melodyData?.length || chordData?.bars || 4,
      exportOptions: options,
    };

    // Save to Firebase
    return await saveMidiFile(midiData, fileName, metadata, userId, isPublic);
  } catch (error) {
    console.error('Error exporting and saving MIDI:', error);
    return null;
  }
};
