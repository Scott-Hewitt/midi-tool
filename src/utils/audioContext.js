// Singleton AudioContext instance
let audioContext = null;
let isInitialized = false;
let hasUserInteraction = false;

export const getAudioContext = () => audioContext;

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

export const isAudioContextInitialized = () => isInitialized;

// This should be called in response to a user gesture
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

export const hasHadUserInteraction = () => hasUserInteraction;

export const registerUserInteraction = () => {
  hasUserInteraction = true;
};
