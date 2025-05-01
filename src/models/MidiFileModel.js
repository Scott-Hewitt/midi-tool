/**
 * MIDI File Model
 *
 * Handles all Firestore operations related to MIDI file data.
 * This model encapsulates the data structure and database operations for MIDI files.
 */

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../services/firebase';

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
 * Get a MIDI file by ID
 * @param {string} fileId - The ID of the file in Firestore
 * @param {string} userId - The user ID (for authorization of private files)
 * @returns {Promise<Object|null>} - The MIDI file metadata or null if not found/unauthorized
 */
export const getMidiFileById = async (fileId, userId = null) => {
  try {
    const fileRef = doc(db, 'midiFiles', fileId);
    const fileDoc = await getDoc(fileRef);

    if (!fileDoc.exists()) {
      return null;
    }

    const fileData = fileDoc.data();

    // Check if the user can access the file
    if (!fileData.isPublic && fileData.userId !== userId) {
      return null; // User is not authorized to access this file
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

/**
 * Get all MIDI files for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Query options (sorting, filtering)
 * @returns {Promise<Array>} - Array of MIDI file metadata
 */
export const getUserMidiFiles = async (userId, options = {}) => {
  try {
    const { sortBy = 'createdAt', sortDirection = 'desc', fileType = null } = options;

    let q = query(collection(db, 'midiFiles'), where('userId', '==', userId));

    // Add file type filter if specified
    if (fileType) {
      q = query(q, where('type', '==', fileType));
    }

    // Add sorting
    q = query(q, orderBy(sortBy, sortDirection));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));
  } catch (error) {
    console.error('Error getting user MIDI files:', error);
    throw error;
  }
};

/**
 * Get public MIDI files
 * @param {Object} options - Query options (limit, sorting, filtering)
 * @returns {Promise<Array>} - Array of public MIDI file metadata
 */
export const getPublicMidiFiles = async (options = {}) => {
  try {
    const {
      maxResults = 20,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      fileType = null,
    } = options;

    let q = query(collection(db, 'midiFiles'), where('isPublic', '==', true));

    // Add file type filter if specified
    if (fileType) {
      q = query(q, where('type', '==', fileType));
    }

    // Add sorting and limit
    q = query(q, orderBy(sortBy, sortDirection), limit(maxResults));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));
  } catch (error) {
    console.error('Error getting public MIDI files:', error);
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
      return false;
    }

    const fileData = fileDoc.data();

    // Check if the user owns the file
    if (fileData.userId !== userId) {
      return false;
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
      return false;
    }

    const fileData = fileDoc.data();

    // Check if the user owns the file
    if (fileData.userId !== userId) {
      return false;
    }

    // Try to delete the file from Storage, but don't fail if it doesn't exist
    try {
      const storageRef = ref(storage, fileData.filePath);
      await deleteObject(storageRef);
    } catch (storageError) {
      // If the error is "object-not-found", continue with deleting the metadata
      // Otherwise, rethrow the error
      if (storageError.code !== 'storage/object-not-found') {
        throw storageError;
      }
      console.warn(`File not found in storage: ${fileData.filePath}. Continuing with metadata deletion.`);
    }

    // Delete the metadata from Firestore
    await deleteDoc(fileRef);

    return true;
  } catch (error) {
    console.error('Error deleting MIDI file:', error);
    throw error;
  }
};
