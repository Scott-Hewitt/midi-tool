import { db } from '../../services/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Get a user's favorite MIDI files
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - A promise that resolves to an array of favorite objects
 */
export const getUserFavorites = async (userId) => {
  try {
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const favorites = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const favoriteData = docSnapshot.data();
      
      // Get the file data
      const fileDoc = await getDoc(doc(db, 'midiFiles', favoriteData.fileId));
      
      if (fileDoc.exists()) {
        favorites.push({
          id: docSnapshot.id,
          fileId: favoriteData.fileId,
          favoritedAt: favoriteData.favoritedAt,
          file: fileDoc.data()
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
 * Add a MIDI file to a user's favorites
 * @param {string} userId - The user's ID
 * @param {string} fileId - The MIDI file ID
 * @returns {Promise<string>} - A promise that resolves to the new favorite document ID
 */
export const addToFavorites = async (userId, fileId) => {
  try {
    // Check if the file exists
    const fileDoc = await getDoc(doc(db, 'midiFiles', fileId));
    
    if (!fileDoc.exists()) {
      throw new Error('MIDI file not found');
    }
    
    // Check if already favorited
    const favoritesRef = collection(db, 'favorites');
    const q = query(
      favoritesRef, 
      where('userId', '==', userId),
      where('fileId', '==', fileId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error('MIDI file already in favorites');
    }
    
    // Add to favorites
    const favoriteDoc = await addDoc(favoritesRef, {
      userId,
      fileId,
      favoritedAt: serverTimestamp()
    });
    
    return favoriteDoc.id;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Remove a MIDI file from a user's favorites
 * @param {string} userId - The user's ID
 * @param {string} fileId - The MIDI file ID
 * @returns {Promise<void>}
 */
export const removeFromFavorites = async (userId, fileId) => {
  try {
    const favoritesRef = collection(db, 'favorites');
    const q = query(
      favoritesRef, 
      where('userId', '==', userId),
      where('fileId', '==', fileId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('MIDI file not found in favorites');
    }
    
    // Delete the favorite document
    await deleteDoc(doc(db, 'favorites', querySnapshot.docs[0].id));
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};
