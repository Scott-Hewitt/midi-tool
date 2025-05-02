import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { getMidiFileById } from './MidiFileModel';

export const addToFavorites = async (userId, fileId) => {
  try {
    // Check if the file exists
    const file = await getMidiFileById(fileId, userId);
    if (!file) {
      throw new Error('File not found or not accessible');
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

export const getUserFavorites = async userId => {
  try {
    const q = query(collection(db, 'favorites'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    // Get the file data for each favorite
    const favorites = [];
    for (const favoriteDoc of querySnapshot.docs) {
      const favoriteData = favoriteDoc.data();
      const file = await getMidiFileById(favoriteData.fileId, userId);

      if (file) {
        favorites.push({
          id: favoriteDoc.id,
          favoriteId: favoriteDoc.id,
          fileId: favoriteData.fileId,
          favoritedAt: favoriteData.createdAt?.toDate().toISOString(),
          file,
        });
      }
    }

    return favorites;
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
};

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
