/**
 * Auth Controller
 *
 * Handles authentication-related business logic.
 * This controller connects the authentication service with the user model.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { createUser, getUserById } from '../models/UserModel';

/**
 * Register a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name
 * @returns {Promise<Object>} - User data
 */
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await createUser(userCredential.user.uid, email, displayName);

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Login with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - User data
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const userData = await getUserById(userCredential.user.uid);

    return userData || {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName
    };
  } catch (error) {
    console.error('Error logging in with email:', error);
    throw error;
  }
};

/**
 * Login with Google
 * @returns {Promise<Object>} - User data
 */
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    let userData = await getUserById(userCredential.user.uid);

    if (!userData) {
      await createUser(
        userCredential.user.uid,
        userCredential.user.email,
        userCredential.user.displayName || 'User'
      );

      userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || 'User'
      };
    }

    return userData;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Get the current authenticated user
 * @returns {Object|null} - Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Get user data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const getUserData = async (uid) => {
  try {
    return await getUserById(uid);
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};
