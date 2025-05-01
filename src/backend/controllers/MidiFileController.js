/**
 * MIDI File Controller
 *
 * Handles MIDI file-related business logic.
 * This controller connects the MIDI file model with the UI components.
 */

import {
  saveMidiFile,
  getMidiFileById,
  getUserMidiFiles,
  getPublicMidiFiles,
  updateMidiFile,
  deleteMidiFile,
} from '../models/MidiFileModel';

/**
 * Generate and save a MIDI file
 * @param {Uint8Array} midiData - MIDI file data
 * @param {string} fileName - File name
 * @param {Object} metadata - File metadata
 * @param {string} userId - User ID
 * @param {boolean} isPublic - Whether the file is public
 * @returns {Promise<string>} - The ID of the saved file
 */
export const saveMidiFileToStorage = async (
  midiData,
  fileName,
  metadata,
  userId,
  isPublic = false
) => {
  try {
    return await saveMidiFile(midiData, fileName, metadata, userId, isPublic);
  } catch (error) {
    console.error('Error saving MIDI file:', error);
    throw error;
  }
};

/**
 * Get a MIDI file by ID
 * @param {string} fileId - File ID
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object|null>} - MIDI file data or null if not found/unauthorized
 */
export const getMidiFile = async (fileId, userId) => {
  try {
    return await getMidiFileById(fileId, userId);
  } catch (error) {
    console.error('Error getting MIDI file:', error);
    throw error;
  }
};

/**
 * Get all MIDI files for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of MIDI files
 */
export const getUserFiles = async (userId, options = {}) => {
  try {
    return await getUserMidiFiles(userId, options);
  } catch (error) {
    console.error('Error getting user files:', error);
    throw error;
  }
};

/**
 * Get public MIDI files
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of public MIDI files
 */
export const getPublicFiles = async (options = {}) => {
  try {
    return await getPublicMidiFiles(options);
  } catch (error) {
    console.error('Error getting public files:', error);
    throw error;
  }
};

/**
 * Update a MIDI file
 * @param {string} fileId - File ID
 * @param {Object} updates - Updates to apply
 * @param {string} userId - User ID for authorization
 * @returns {Promise<boolean>} - Whether the update was successful
 */
export const updateFile = async (fileId, updates, userId) => {
  try {
    return await updateMidiFile(fileId, updates, userId);
  } catch (error) {
    console.error('Error updating MIDI file:', error);
    throw error;
  }
};

/**
 * Delete a MIDI file
 * @param {string} fileId - File ID
 * @param {string} userId - User ID for authorization
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export const deleteFile = async (fileId, userId) => {
  try {
    return await deleteMidiFile(fileId, userId);
  } catch (error) {
    console.error('Error deleting MIDI file:', error);
    throw error;
  }
};
