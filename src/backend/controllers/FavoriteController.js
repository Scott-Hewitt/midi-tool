/**
 * Favorite Controller
 *
 * Handles favorite-related business logic.
 * This controller connects the favorite model with the UI components.
 */

import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  isFileFavorited,
} from '../models/FavoriteModel';

/**
 * Add a MIDI file to user's favorites
 * @param {string} userId - User ID
 * @param {string} fileId - MIDI file ID
 * @returns {Promise<string>} - Favorite document ID
 */
export const addFavorite = async (userId, fileId) => {
  try {
    return await addToFavorites(userId, fileId);
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

/**
 * Remove a MIDI file from user's favorites
 * @param {string} userId - User ID
 * @param {string} fileId - MIDI file ID
 * @returns {Promise<boolean>} - Whether the removal was successful
 */
export const removeFavorite = async (userId, fileId) => {
  try {
    return await removeFromFavorites(userId, fileId);
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

/**
 * Get all favorites for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of favorites with file data
 */
export const getFavorites = async userId => {
  try {
    return await getUserFavorites(userId);
  } catch (error) {
    console.error('Error getting favorites:', error);
    throw error;
  }
};

/**
 * Check if a file is favorited by a user
 * @param {string} userId - User ID
 * @param {string} fileId - MIDI file ID
 * @returns {Promise<boolean>} - Whether the file is favorited
 */
export const checkFavoriteStatus = async (userId, fileId) => {
  try {
    return await isFileFavorited(userId, fileId);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    throw error;
  }
};

/**
 * Toggle favorite status for a file
 * @param {string} userId - User ID
 * @param {string} fileId - MIDI file ID
 * @param {boolean} currentStatus - Current favorite status
 * @returns {Promise<boolean>} - New favorite status
 */
export const toggleFavorite = async (userId, fileId, currentStatus) => {
  try {
    if (currentStatus) {
      await removeFromFavorites(userId, fileId);
      return false;
    } else {
      await addToFavorites(userId, fileId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    throw error;
  }
};
