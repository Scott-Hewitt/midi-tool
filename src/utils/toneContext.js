import * as Tone from 'tone';
import { hasHadUserInteraction, getAudioContext } from './audioContext';

let isToneInitialized = false;
let toneModule = Tone;

async function reloadToneModule() {
  try {
    // Dynamic import to get a fresh copy of Tone.js
    const freshTone = await import('tone');
    toneModule = freshTone;
    console.log('Reloaded Tone.js module');
    return true;
  } catch (error) {
    console.error('Failed to reload Tone.js module:', error);
    return false;
  }
}

// This must be called in response to a genuine user gesture
export const initializeTone = async () => {
  if (!hasHadUserInteraction()) {
    console.warn('Cannot initialize Tone.js without user interaction');
    return false;
  }

  const audioContext = getAudioContext();
  if (!audioContext) {
    console.error('No AudioContext available');
    return false;
  }

  let needsReload = false;

  if (toneModule.context) {
    // Check the state of the Tone.js context
    if (toneModule.context.state === 'closed') {
      console.log('Tone.js context is closed, reloading module');
      needsReload = true;
    } else if (toneModule.context.state === 'suspended') {
      try {
        // Try to resume the existing context
        await toneModule.context.resume();
        console.log('Tone.js context resumed successfully');
        isToneInitialized = true;
        return true;
      } catch (error) {
        console.error('Failed to resume Tone.js context, will reload:', error);
        needsReload = true;
      }
    } else if (toneModule.context.state === 'running' && isToneInitialized) {
      // Already initialized and running
      return true;
    }
  }

  // Reload Tone.js if needed
  if (needsReload) {
    const reloaded = await reloadToneModule();
    if (!reloaded) {
      console.error('Failed to reload Tone.js');
      return false;
    }
  }

  try {
    // Remove no-audio class if it exists
    if (document.documentElement.classList.contains('no-audio')) {
      document.documentElement.classList.remove('no-audio');
    }

    // Start Tone.js - this must be called during a user gesture event
    // Use the current module reference
    await toneModule.start();
    isToneInitialized = true;
    console.log('Tone.js initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Tone.js:', error);

    // Even if Tone.js fails, we can still proceed with basic audio
    // as long as we have a valid AudioContext
    if (audioContext && audioContext.state === 'running') {
      console.log('Proceeding with basic audio capabilities');
      return true;
    }

    return false;
  }
};

export const isToneInitializedStatus = () => isToneInitialized;

export const createSynth = () =>
  // This should only be called after Tone has been initialized
  new toneModule.PolySynth(toneModule.Synth).toDestination();

/**
 * Get the Tone.js context
 * @returns {AudioContext} - The Tone.js audio context
 */
export const getToneContext = () => toneModule.context;
