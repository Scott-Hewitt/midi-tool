/**
 * Authentication Context
 *
 * Provides authentication state and methods to the entire application.
 * Uses the AuthController to handle authentication logic.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebase';
import {
  registerUser,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  getUserData
} from '../../controllers/AuthController';

const AuthContext = createContext();

/**
 * Custom hook to use the auth context
 * @returns {Object} - Auth context value
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Authentication Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} - Provider component
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Sign up with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} displayName - User's display name
   * @returns {Promise<Object>} - User data
   */
  async function signup(email, password, displayName) {
    try {
      const user = await registerUser(email, password, displayName);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} - User data
   */
  async function login(email, password) {
    try {
      const user = await loginWithEmail(email, password);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in with Google
   * @returns {Promise<Object>} - User data
   */
  async function loginWithGoogleProvider() {
    try {
      const user = await loginWithGoogle();
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out
   * @returns {Promise<void>}
   */
  async function logout() {
    try {
      await logoutUser();
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch user profile from Firestore
   * @param {string} uid - User ID
   * @returns {Promise<Object|null>} - User profile data
   */
  async function fetchUserProfile(uid) {
    try {
      const userData = await getUserData(uid);
      if (userData) {
        setUserProfile(userData);
      }
      return userData;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle: loginWithGoogleProvider,
    logout,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
