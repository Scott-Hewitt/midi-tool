import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Add a MIDI file to user's favorites
 * @param {string} userId - The user ID
 * @param {string} fileId - The MIDI file ID
 * @returns {Promise<string>} - The ID of the favorite document
 */
export const addToFavorites = async (userId, fileId) => {
  try {
    // Check if the file exists
    const fileRef = doc(db, 'midiFiles', fileId);
    const fileDoc = await getDoc(fileRef);

    if (!fileDoc.exists()) {
      throw new Error('File not found');
    }

    // Check if already favorited
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('fileId', '==', fileId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Already favorited
      return querySnapshot.docs[0].id;
    }

    // Add to favorites
    const docRef = await addDoc(collection(db, 'favorites'), {
      userId,
      fileId,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Remove a MIDI file from user's favorites
 * @param {string} userId - The user ID
 * @param {string} fileId - The MIDI file ID
 * @returns {Promise<boolean>} - Whether the removal was successful
 */
export const removeFromFavorites = async (userId, fileId) => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('fileId', '==', fileId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Not favorited
      return false;
    }

    // Remove from favorites
    await deleteDoc(doc(db, 'favorites', querySnapshot.docs[0].id));

    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Get all favorites for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of favorite MIDI files with metadata
 */
export const getUserFavorites = async userId => {
  try {
    const q = query(collection(db, 'favorites'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    // Get the file data for each favorite
    const favorites = [];
    for (const favoriteDoc of querySnapshot.docs) {
      const favoriteData = favoriteDoc.data();
      const fileRef = doc(db, 'midiFiles', favoriteData.fileId);
      const fileDoc = await getDoc(fileRef);

      if (fileDoc.exists()) {
        favorites.push({
          id: favoriteDoc.id,
          favoriteId: favoriteDoc.id,
          fileId: favoriteData.fileId,
          favoritedAt: favoriteData.createdAt,
          file: {
            id: fileDoc.id,
            ...fileDoc.data(),
          },
        });
      }
    }

    return favorites;
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
};

/**
 * Check if a file is favorited by a user
 * @param {string} userId - The user ID
 * @param {string} fileId - The MIDI file ID
 * @returns {Promise<boolean>} - Whether the file is favorited
 */
export const isFileFavorited = async (userId, fileId) => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('fileId', '==', fileId)
    );
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if file is favorited:', error);
    throw error;
  }
};
