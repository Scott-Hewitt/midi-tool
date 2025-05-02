import { saveMidiFileToStorage } from '../controllers/MidiFileController';

export const saveMidiFile = async (midiData, fileName, metadata, userId, isPublic = false) => {
  try {
    if (!midiData) {
      console.error('No MIDI data to save');
      return null;
    }

    if (!userId) {
      console.error('User not authenticated');
      return null;
    }
    const fileId = await saveMidiFileToStorage(midiData, fileName, metadata, userId, isPublic);

    return fileId;
  } catch (error) {
    console.error('Error saving MIDI file:', error);
    return null;
  }
};
