// Tone.js Context Manager
import * as Tone from 'tone';

// Track if Tone.js is initialized
let isToneInitialized = false;

/**
 * Initialize Tone.js context on user interaction
 * This must be called in response to a genuine user gesture
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export const initializeTone = async () => {
  if (isToneInitialized) {
    // If already initialized but suspended, resume it
    if (Tone.context.state === 'suspended') {
      try {
        await Tone.context.resume();
        console.log('Tone.js context resumed successfully');
      } catch (error) {
        console.error('Failed to resume Tone.js context:', error);
        return false;
      }
    }
    return true;
  }

  try {
    // Remove no-audio class if it exists
    if (document.documentElement.classList.contains('no-audio')) {
      document.documentElement.classList.remove('no-audio');
    }

    // Start Tone.js - this must be called during a user gesture event
    await Tone.start();
    isToneInitialized = true;
    console.log('Tone.js initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Tone.js:', error);
    return false;
  }
};

/**
 * Check if Tone.js is initialized
 * @returns {boolean} - Whether Tone.js is initialized
 */
export const isToneInitializedStatus = () => {
  return isToneInitialized;
};

/**
 * Create a synth safely (only when needed)
 * @returns {Tone.PolySynth} - A new polyphonic synth
 */
export const createSynth = () => {
  // This should only be called after Tone has been initialized
  return new Tone.PolySynth(Tone.Synth).toDestination();
};

/**
 * Get the Tone.js context
 * @returns {AudioContext} - The Tone.js audio context
 */
export const getToneContext = () => {
  return Tone.context;
};
