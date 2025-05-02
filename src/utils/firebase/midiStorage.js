import { db, storage } from '../../services/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const saveMidiFile = async (file, metadata, userId) => {
  try {
    const storageRef = ref(storage, `users/${userId}/midi/${file.name}`);

    const snapshot = await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(snapshot.ref);
    const midiFilesRef = collection(db, 'midiFiles');
    const docRef = await addDoc(midiFilesRef, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      downloadURL,
      storagePath: snapshot.ref.fullPath,
      userId,
      isPublic: metadata.isPublic || false,
      type: metadata.type || 'unknown',
      key: metadata.key || '',
      tempo: metadata.tempo || 120,
      notes: metadata.notes || [],
      chords: metadata.chords || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving MIDI file:', error);
    throw error;
  }
};

export const getUserMidiFiles = async userId => {
  try {
    const midiFilesRef = collection(db, 'midiFiles');
    const q = query(midiFilesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user MIDI files:', error);
    throw error;
  }
};

export const getPublicMidiFiles = async () => {
  try {
    const midiFilesRef = collection(db, 'midiFiles');
    const q = query(midiFilesRef, where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting public MIDI files:', error);
    throw error;
  }
};

/**
 * Get a MIDI file by ID
 * @param {string} fileId - The MIDI file ID
 * @returns {Promise<Object>} - A promise that resolves to the MIDI file object
 */
export const getMidiFile = async fileId => {
  try {
    const docRef = doc(db, 'midiFiles', fileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      throw new Error('MIDI file not found');
    }
  } catch (error) {
    console.error('Error getting MIDI file:', error);
    throw error;
  }
};

/**
 * Update a MIDI file
 * @param {string} fileId - The MIDI file ID
 * @param {Object} updates - The updates to apply
 * @param {string} userId - The user's ID (for authorization)
 * @returns {Promise<void>}
 */
export const updateMidiFile = async (fileId, updates, userId) => {
  try {
    const file = await getMidiFile(fileId);

    if (file.userId !== userId) {
      throw new Error('You do not have permission to update this file');
    }
    const docRef = doc(db, 'midiFiles', fileId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating MIDI file:', error);
    throw error;
  }
};

/**
 * Delete a MIDI file
 * @param {string} fileId - The MIDI file ID
 * @param {string} userId - The user's ID (for authorization)
 * @returns {Promise<void>}
 */
export const deleteMidiFile = async (fileId, userId) => {
  try {
    const file = await getMidiFile(fileId);

    if (file.userId !== userId) {
      throw new Error('You do not have permission to delete this file');
    }

    if (file.storagePath) {
      const storageRef = ref(storage, file.storagePath);
      await deleteObject(storageRef);
    }
    const docRef = doc(db, 'midiFiles', fileId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting MIDI file:', error);
    throw error;
  }
};
