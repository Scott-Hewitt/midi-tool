import {
  saveMidiFile,
  getMidiFileById,
  getUserMidiFiles,
  getPublicMidiFiles,
  updateMidiFile,
  deleteMidiFile,
} from '../models/MidiFileModel';

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

export const getMidiFile = async (fileId, userId) => {
  try {
    return await getMidiFileById(fileId, userId);
  } catch (error) {
    console.error('Error getting MIDI file:', error);
    throw error;
  }
};

export const getUserFiles = async (userId, options = {}) => {
  try {
    return await getUserMidiFiles(userId, options);
  } catch (error) {
    console.error('Error getting user files:', error);
    throw error;
  }
};

export const getPublicFiles = async (options = {}) => {
  try {
    return await getPublicMidiFiles(options);
  } catch (error) {
    console.error('Error getting public files:', error);
    throw error;
  }
};

export const updateFile = async (fileId, updates, userId) => {
  try {
    return await updateMidiFile(fileId, updates, userId);
  } catch (error) {
    console.error('Error updating MIDI file:', error);
    throw error;
  }
};

export const deleteFile = async (fileId, userId) => {
  try {
    return await deleteMidiFile(fileId, userId);
  } catch (error) {
    console.error('Error deleting MIDI file:', error);
    throw error;
  }
};
