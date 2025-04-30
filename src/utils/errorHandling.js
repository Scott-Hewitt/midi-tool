/**
 * Error Handling Utilities
 * 
 * This module provides utilities for consistent error handling across the application.
 */

/**
 * Map Firebase error codes to user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const getFirebaseErrorMessage = (error) => {
  const errorCode = error.code || '';
  
  // Authentication errors
  const authErrors = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled for this project.',
    'auth/requires-recent-login': 'This operation requires recent authentication. Please log in again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completing the sign-in.',
    'auth/cancelled-popup-request': 'The sign-in popup was cancelled.',
    'auth/popup-blocked': 'The sign-in popup was blocked by the browser.',
    'auth/network-request-failed': 'A network error occurred. Please check your connection and try again.',
  };
  
  // Firestore errors
  const firestoreErrors = {
    'permission-denied': 'You don\'t have permission to perform this action.',
    'not-found': 'The requested document was not found.',
    'already-exists': 'The document already exists.',
    'resource-exhausted': 'Too many requests. Please try again later.',
    'failed-precondition': 'Operation failed due to the current state of the database.',
    'aborted': 'The operation was aborted.',
    'out-of-range': 'Operation was attempted past the valid range.',
    'unimplemented': 'This operation is not implemented or supported.',
    'internal': 'An internal error occurred. Please try again later.',
    'unavailable': 'The service is currently unavailable. Please try again later.',
    'data-loss': 'Unrecoverable data loss or corruption.',
    'unauthenticated': 'You must be logged in to perform this action.',
  };
  
  // Storage errors
  const storageErrors = {
    'storage/object-not-found': 'The file does not exist.',
    'storage/unauthorized': 'You don\'t have permission to access this file.',
    'storage/canceled': 'The operation was canceled.',
    'storage/unknown': 'An unknown error occurred.',
    'storage/quota-exceeded': 'Storage quota exceeded.',
    'storage/invalid-checksum': 'File on the client does not match the checksum of the file received by the server.',
    'storage/retry-limit-exceeded': 'Maximum retry time for operation exceeded.',
    'storage/invalid-event-name': 'Invalid event name provided.',
    'storage/invalid-url': 'Invalid URL provided.',
    'storage/invalid-argument': 'Invalid argument provided.',
    'storage/no-default-bucket': 'No default bucket found.',
    'storage/cannot-slice-blob': 'Cannot slice blob.',
    'storage/server-file-wrong-size': 'File on the server does not match the size of the file received by the server.',
  };
  
  // MIDI-specific errors
  const midiErrors = {
    'midi/invalid-data': 'Invalid MIDI data format.',
    'midi/export-failed': 'Failed to export MIDI file.',
    'midi/save-failed': 'Failed to save MIDI file.',
    'midi/download-failed': 'Failed to download MIDI file.',
    'midi/playback-failed': 'Failed to play MIDI file.',
  };
  
  // Combine all error maps
  const errorMap = {
    ...authErrors,
    ...firestoreErrors,
    ...storageErrors,
    ...midiErrors,
  };
  
  // Return the mapped error message or a generic message
  return errorMap[errorCode] || error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Log error to console with additional context
 * @param {string} context - The context where the error occurred
 * @param {Error} error - The error object
 */
export const logError = (context, error) => {
  console.error(`Error in ${context}:`, error);
  
  // You could extend this to log to a service like Firebase Crashlytics
  // or another error tracking service
};

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {Function} toast - Toast function for displaying errors
 * @param {string} context - Context for the error
 */
export const handleApiError = (error, toast, context = 'operation') => {
  const errorMessage = getFirebaseErrorMessage(error);
  
  // Log the error
  logError(context, error);
  
  // Display toast notification if toast function is provided
  if (toast) {
    toast({
      title: `Error during ${context}`,
      description: errorMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }
  
  return errorMessage;
};
