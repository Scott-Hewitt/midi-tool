import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../backend/services/firebase';
import {
  registerUser,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  getUserData,
} from '../../backend/controllers/AuthController';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName) {
    // Direct return without unnecessary try/catch
    return registerUser(email, password, displayName);
  }

  /**
   * Sign in with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} - User data
   */
  async function login(email, password) {
    // Direct return without unnecessary try/catch
    return loginWithEmail(email, password);
  }

  /**
   * Sign in with Google
   * @returns {Promise<Object>} - User data
   */
  async function loginWithGoogleProvider() {
    // Direct return without unnecessary try/catch
    return loginWithGoogle();
  }

  /**
   * Sign out
   * @returns {Promise<void>}
   */
  async function logout() {
    await logoutUser();
    setUserProfile(null);
  }

  async function fetchUserProfile(uid) {
    try {
      const userData = await getUserData(uid);
      if (userData) {
        setUserProfile(userData);
      }
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
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

  // Context value
  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle: loginWithGoogleProvider,
    logout,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
