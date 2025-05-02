import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  isFileFavorited,
} from '../models/FavoriteModel';

export const addFavorite = async (userId, fileId) => {
  try {
    return await addToFavorites(userId, fileId);
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

export const removeFavorite = async (userId, fileId) => {
  try {
    return await removeFromFavorites(userId, fileId);
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

export const getFavorites = async userId => {
  try {
    return await getUserFavorites(userId);
  } catch (error) {
    console.error('Error getting favorites:', error);
    throw error;
  }
};

export const checkFavoriteStatus = async (userId, fileId) => {
  try {
    return await isFileFavorited(userId, fileId);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    throw error;
  }
};

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
