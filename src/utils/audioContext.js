// Utility for managing a shared AudioContext that respects browser policies

// Singleton AudioContext instance
let audioContext = null;
let isInitialized = false;
let hasUserInteraction = false;

/**
 * Get the shared AudioContext instance
 * @returns {AudioContext|null} - The AudioContext instance or null if not initialized
 */
export const getAudioContext = () => audioContext;

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
    } else if (audioContext.state === 'closed') {
      // If the context is closed, create a new one
      console.log('AudioContext is closed, creating a new one');
      audioContext = null;
      return initializeAudioContext();
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
export const isAudioContextInitialized = () => isInitialized;

/**
 * Ensure the AudioContext is running
 * This should be called in response to a user gesture
 * @returns {Promise<AudioContext>} - A promise that resolves to the AudioContext instance
 */
export const ensureAudioContext = async () => {
  // Mark that we've had user interaction
  hasUserInteraction = true;

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
  } else if (audioContext.state === 'closed') {
    // If the context is closed, create a new one
    console.log('AudioContext is closed, creating a new one');
    audioContext = null;
    return initializeAudioContext();
  }

  return audioContext;
};

/**
 * Check if we've had user interaction
 * @returns {boolean} - True if we've had user interaction
 */
export const hasHadUserInteraction = () => hasUserInteraction;

/**
 * Register a user interaction event
 * Call this on any user interaction (click, touch, etc.)
 */
export const registerUserInteraction = () => {
  hasUserInteraction = true;
};
