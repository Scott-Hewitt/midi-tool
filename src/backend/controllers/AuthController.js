import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { createUser, getUserById } from '../models/UserModel';

export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await createUser(userCredential.user.uid, email, displayName);

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const userData = await getUserById(userCredential.user.uid);

    return (
      userData || {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      }
    );
  } catch (error) {
    console.error('Error logging in with email:', error);
    throw error;
  }
};

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
        displayName: userCredential.user.displayName || 'User',
      };
    }

    return userData;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = () => auth.currentUser;

export const getUserData = async uid => {
  try {
    return await getUserById(uid);
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};
