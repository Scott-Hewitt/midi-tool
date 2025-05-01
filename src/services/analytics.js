/**
 * Analytics Service
 * 
 * This module initializes and provides Firebase Analytics functionality.
 */

import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from './firebase';

// Initialize Firebase Analytics
let analytics = null;

try {
  analytics = getAnalytics(app);
} catch (error) {
  console.error('Failed to initialize Firebase Analytics:', error);
}

/**
 * Log an event to Firebase Analytics
 * @param {string} eventName - Name of the event
 * @param {Object} eventParams - Event parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (!analytics) return;
  
  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error(`Error logging event ${eventName}:`, error);
  }
};

/**
 * Set the user ID for Firebase Analytics
 * @param {string} userId - User ID
 */
export const setAnalyticsUserId = (userId) => {
  if (!analytics || !userId) return;
  
  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error('Error setting user ID for analytics:', error);
  }
};

/**
 * Set user properties for Firebase Analytics
 * @param {Object} properties - User properties
 */
export const setAnalyticsUserProperties = (properties) => {
  if (!analytics || !properties) return;
  
  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error('Error setting user properties for analytics:', error);
  }
};

/**
 * Track page view
 * @param {string} pageName - Name of the page
 * @param {Object} pageParams - Additional page parameters
 */
export const trackPageView = (pageName, pageParams = {}) => {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname,
    ...pageParams
  });
};

/**
 * Track user sign-in
 * @param {string} method - Sign-in method (e.g., 'email', 'google')
 */
export const trackSignIn = (method) => {
  trackEvent('login', { method });
};

/**
 * Track user sign-up
 * @param {string} method - Sign-up method (e.g., 'email', 'google')
 */
export const trackSignUp = (method) => {
  trackEvent('sign_up', { method });
};

/**
 * Track MIDI file generation
 * @param {string} type - Type of MIDI file (e.g., 'melody', 'chord', 'composition')
 * @param {Object} params - Additional parameters
 */
export const trackMidiGeneration = (type, params = {}) => {
  trackEvent('generate_midi', {
    type,
    ...params
  });
};

/**
 * Track MIDI file download
 * @param {string} fileId - ID of the MIDI file
 * @param {string} type - Type of MIDI file
 */
export const trackMidiDownload = (fileId, type) => {
  trackEvent('download_midi', {
    file_id: fileId,
    type
  });
};

/**
 * Track MIDI file save to account
 * @param {string} fileId - ID of the MIDI file
 * @param {string} type - Type of MIDI file
 * @param {boolean} isPublic - Whether the file is public
 */
export const trackMidiSave = (fileId, type, isPublic) => {
  trackEvent('save_midi', {
    file_id: fileId,
    type,
    is_public: isPublic
  });
};

/**
 * Track adding a MIDI file to favorites
 * @param {string} fileId - ID of the MIDI file
 */
export const trackAddToFavorites = (fileId) => {
  trackEvent('add_to_favorites', {
    file_id: fileId
  });
};

/**
 * Track removing a MIDI file from favorites
 * @param {string} fileId - ID of the MIDI file
 */
export const trackRemoveFromFavorites = (fileId) => {
  trackEvent('remove_from_favorites', {
    file_id: fileId
  });
};

/**
 * Track MIDI file deletion
 * @param {string} fileId - ID of the MIDI file
 * @param {string} type - Type of MIDI file
 */
export const trackMidiDeletion = (fileId, type) => {
  trackEvent('delete_midi', {
    file_id: fileId,
    type
  });
};

/**
 * Track MIDI file update
 * @param {string} fileId - ID of the MIDI file
 * @param {string} type - Type of MIDI file
 * @param {Array} updatedFields - Array of updated field names
 */
export const trackMidiUpdate = (fileId, type, updatedFields = []) => {
  trackEvent('update_midi', {
    file_id: fileId,
    type,
    updated_fields: updatedFields.join(',')
  });
};

/**
 * Track MIDI file playback
 * @param {string} fileId - ID of the MIDI file
 * @param {string} type - Type of MIDI file
 */
export const trackMidiPlayback = (fileId, type) => {
  trackEvent('play_midi', {
    file_id: fileId,
    type
  });
};

/**
 * Track user data export
 * @param {string} exportType - Type of export (e.g., 'all_midi', 'user_data')
 * @param {number} itemCount - Number of items exported
 */
export const trackDataExport = (exportType, itemCount) => {
  trackEvent('export_data', {
    export_type: exportType,
    item_count: itemCount
  });
};

/**
 * Track error occurrence
 * @param {string} errorCode - Error code or type
 * @param {string} errorMessage - Error message
 * @param {string} context - Context where the error occurred
 */
export const trackError = (errorCode, errorMessage, context) => {
  trackEvent('app_error', {
    error_code: errorCode,
    error_message: errorMessage,
    error_context: context
  });
};
