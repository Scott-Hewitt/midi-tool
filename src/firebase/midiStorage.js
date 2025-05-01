import { ref, uploadBytes, getDownloadURL, /* listAll, */ deleteObject } from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { storage, db } from './config';

/**
 * Save a MIDI file to Firebase Storage and add metadata to Firestore
 * @param {Uint8Array} midiData - The MIDI file data
 * @param {string} fileName - The name of the file
 * @param {Object} metadata - Metadata about the MIDI file (scale, tempo, etc.)
 * @param {string} userId - The user ID
 * @param {boolean} isPublic - Whether the file is public or private
 * @returns {Promise<string>} - The ID of the saved file
 */
export const saveMidiFile = async (midiData, fileName, metadata, userId, isPublic = false) => {
  try {
    // Create a blob from the MIDI data
    const midiBlob = new Blob([midiData], { type: 'audio/midi' });

    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `midiFiles/${userId}/${fileName}.mid`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, midiBlob, {
      customMetadata: {
        isPublic: isPublic.toString(),
        type: metadata.type || 'unknown',
      },
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Add metadata to Firestore
    const docRef = await addDoc(collection(db, 'midiFiles'), {
      fileName,
      filePath: snapshot.ref.fullPath,
      downloadURL,
      userId,
      isPublic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...metadata,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving MIDI file:', error);
    throw error;
  }
};

/**
 * Get all MIDI files for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of MIDI file metadata
 */
export const getUserMidiFiles = async userId => {
  try {
    const q = query(collection(db, 'midiFiles'), where('userId', '==', userId));
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

/**
 * Get public MIDI files
 * @param {number} limit - Maximum number of files to return
 * @returns {Promise<Array>} - Array of public MIDI file metadata
 */
export const getPublicMidiFiles = async (limit = 20) => {
  try {
    const q = query(collection(db, 'midiFiles'), where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting public MIDI files:', error);
    throw error;
  }
};

/**
 * Delete a MIDI file
 * @param {string} fileId - The ID of the file in Firestore
 * @param {string} userId - The user ID (for authorization)
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export const deleteMidiFile = async (fileId, userId) => {
  try {
    // Get the file metadata from Firestore
    const fileRef = doc(db, 'midiFiles', fileId);
    const fileDoc = await getDoc(fileRef);

    if (!fileDoc.exists()) {
      throw new Error('File not found');
    }

    const fileData = fileDoc.data();

    // Check if the user owns the file
    if (fileData.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Delete the file from Storage
    const storageRef = ref(storage, fileData.filePath);
    await deleteObject(storageRef);

    // Delete the metadata from Firestore
    await deleteDoc(fileRef);

    return true;
  } catch (error) {
    console.error('Error deleting MIDI file:', error);
    throw error;
  }
};

/**
 * Update a MIDI file's metadata
 * @param {string} fileId - The ID of the file in Firestore
 * @param {Object} updates - The updates to apply
 * @param {string} userId - The user ID (for authorization)
 * @returns {Promise<boolean>} - Whether the update was successful
 */
export const updateMidiFile = async (fileId, updates, userId) => {
  try {
    // Get the file metadata from Firestore
    const fileRef = doc(db, 'midiFiles', fileId);
    const fileDoc = await getDoc(fileRef);

    if (!fileDoc.exists()) {
      throw new Error('File not found');
    }

    const fileData = fileDoc.data();

    // Check if the user owns the file
    if (fileData.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Update the file metadata
    await updateDoc(fileRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error updating MIDI file:', error);
    throw error;
  }
};

/**
 * Get a single MIDI file by ID
 * @param {string} fileId - The ID of the file in Firestore
 * @param {string} userId - The user ID (for authorization of private files)
 * @returns {Promise<Object>} - The MIDI file metadata
 */
export const getMidiFile = async (fileId, userId = null) => {
  try {
    const fileRef = doc(db, 'midiFiles', fileId);
    const fileDoc = await getDoc(fileRef);

    if (!fileDoc.exists()) {
      throw new Error('File not found');
    }

    const fileData = fileDoc.data();

    // Check if the user can access the file
    if (!fileData.isPublic && fileData.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return {
      id: fileDoc.id,
      ...fileData,
    };
  } catch (error) {
    console.error('Error getting MIDI file:', error);
    throw error;
  }
};
