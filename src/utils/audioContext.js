// Utility for managing a shared AudioContext that respects browser policies

// Singleton AudioContext instance
let audioContext = null;
let isInitialized = false;

/**
 * Get the shared AudioContext instance
 * @returns {AudioContext|null} - The AudioContext instance or null if not initialized
 */
export const getAudioContext = () => {
  return audioContext;
};

/**
 * Initialize the AudioContext on user interaction
 * @returns {Promise<AudioContext>} - A promise that resolves to the AudioContext instance
 */
export const initializeAudioContext = async () => {
  if (audioContext) {
    // If the context is already created but suspended, resume it
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        console.log('AudioContext resumed successfully');
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
    return audioContext;
  }

  try {
    // Create a new AudioContext
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    isInitialized = true;
    console.log('AudioContext created successfully');
    return audioContext;
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    return null;
  }
};

/**
 * Check if the AudioContext is initialized
 * @returns {boolean} - True if the AudioContext is initialized, false otherwise
 */
export const isAudioContextInitialized = () => {
  return isInitialized;
};

/**
 * Ensure the AudioContext is running
 * This should be called in response to a user gesture
 * @returns {Promise<AudioContext>} - A promise that resolves to the AudioContext instance
 */
export const ensureAudioContext = async () => {
  if (!audioContext) {
    return initializeAudioContext();
  }

  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('AudioContext resumed successfully');
    } catch (error) {
      console.error('Failed to resume AudioContext:', error);
    }
  }

  return audioContext;
};