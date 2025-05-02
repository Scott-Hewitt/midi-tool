import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';

export const createUser = async (uid, email, displayName) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      displayName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorites: [],
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Get a user by ID
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const getUserById = async uid => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const addFavorite = async (uid, fileId) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      favorites: arrayUnion(fileId),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

export const removeFavorite = async (uid, fileId) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      favorites: arrayRemove(fileId),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

export const isFileFavorited = async (uid, fileId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.favorites && userData.favorites.includes(fileId);
    }
    return false;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    throw error;
  }
};
