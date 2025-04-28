// Error Handling Utility for Audio and MIDI Operations

/**
 * Custom error types
 */
export class AudioError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'AudioError';
    this.originalError = originalError;
  }
}

export class MIDIError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'MIDIError';
    this.originalError = originalError;
  }
}

export class SoundFontError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'SoundFontError';
    this.originalError = originalError;
  }
}

/**
 * Error handler for audio context initialization
 * @param {Function} onError - Callback for error handling
 * @returns {AudioContext} The audio context or null if failed
 */
export function initializeAudioContext(onError) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    
    if (!AudioContext) {
      throw new AudioError('AudioContext is not supported in this browser');
    }
    
    const context = new AudioContext();
    
    // Check if context is in suspended state (autoplay policy)
    if (context.state === 'suspended') {
      const resumeAudio = async () => {
        await context.resume();
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
      };
      
      document.addEventListener('click', resumeAudio);
      document.addEventListener('touchstart', resumeAudio);
      document.addEventListener('keydown', resumeAudio);
      
      console.log('Audio context is suspended. Interaction required to resume audio context.');
    }
    
    return context;
  } catch (error) {
    const audioError = error instanceof AudioError 
      ? error 
      : new AudioError('Failed to initialize audio context', error);
    
    if (onError) {
      onError(audioError);
    } else {
      console.error(audioError);
    }
    
    return null;
  }
}

/**
 * Check if Web MIDI API is supported
 * @returns {boolean} Whether Web MIDI API is supported
 */
export function isMIDISupported() {
  return navigator.requestMIDIAccess !== undefined;
}

/**
 * Safe wrapper for async functions with proper error handling
 * @param {Function} asyncFn - The async function to execute
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @param {Function} onFinally - Finally callback
 */
export async function safeAsyncOperation(asyncFn, onSuccess, onError, onFinally) {
  try {
    const result = await asyncFn();
    if (onSuccess) {
      onSuccess(result);
    }
    return result;
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Operation failed:', error);
    }
    return null;
  } finally {
    if (onFinally) {
      onFinally();
    }
  }
}

/**
 * Display user-friendly error messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyErrorMessage(error) {
  if (error instanceof AudioError) {
    return `Audio Error: ${error.message}. Please check your browser's audio settings or try a different browser.`;
  }
  
  if (error instanceof MIDIError) {
    return `MIDI Error: ${error.message}. MIDI functionality may not be supported in this browser.`;
  }
  
  if (error instanceof SoundFontError) {
    return `Sound Error: ${error.message}. Try using the basic synthesizer instead.`;
  }
  
  // Handle specific error types
  if (error.name === 'NotAllowedError') {
    return 'Audio playback was blocked. Please interact with the page first (click anywhere) to enable audio.';
  }
  
  if (error.name === 'NotSupportedError') {
    return 'This feature is not supported in your browser. Please try using a modern browser like Chrome, Firefox, or Edge.';
  }
  
  if (error.message.includes('quota')) {
    return 'Storage quota exceeded. Please clear some browser data or try using private browsing mode.';
  }
  
  // Default message
  return `An error occurred: ${error.message}. Please try again or refresh the page.`;
}
