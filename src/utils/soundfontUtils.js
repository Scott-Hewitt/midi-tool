// SoundFont-Player integration for realistic instrument sounds
import Soundfont from 'soundfont-player';

/**
 * Custom error class for SoundFont-related errors
 */
export class SoundFontError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'SoundFontError';
    this.originalError = originalError;
  }
}

// Cache for loaded instruments
const instrumentCache = {};

/**
 * Check if Web Audio API is supported in the current browser
 * @returns {boolean} - Whether Web Audio API is supported
 */
export const isWebAudioSupported = () => {
  return typeof window !== 'undefined' && 
         (typeof window.AudioContext !== 'undefined' || 
          typeof window.webkitAudioContext !== 'undefined');
};

/**
 * Create an audio context with error handling
 * @returns {Object} - Audio context or null if not supported
 */
export const createAudioContext = () => {
  if (!isWebAudioSupported()) {
    console.error('Web Audio API is not supported in this browser');
    return null;
  }

  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch (error) {
    console.error('Failed to create audio context:', error);
    return null;
  }
};

/**
 * Load a SoundFont instrument
 * @param {string} instrumentName - Name of the instrument to load
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {boolean} tryFallback - Whether to try loading a fallback instrument if the requested one fails
 * @returns {Promise<Object>} - SoundFont instrument player
 * @throws {SoundFontError} - If instrument loading fails and no fallback is available
 */
export const loadInstrument = async (
  instrumentName = 'acoustic_grand_piano', 
  audioContext = null,
  tryFallback = true
) => {
  // Check if Web Audio API is supported
  if (!isWebAudioSupported()) {
    throw new SoundFontError('Web Audio API is not supported in this browser');
  }

  // Create audio context if not provided
  const ctx = audioContext || createAudioContext();

  if (!ctx) {
    throw new SoundFontError('Failed to create audio context');
  }

  // Check if instrument is already loaded
  const cacheKey = `${instrumentName}_${ctx.id}`;
  if (instrumentCache[cacheKey]) {
    return instrumentCache[cacheKey];
  }

  try {
    // Resume audio context if it's suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Load the instrument
    const instrument = await Soundfont.instrument(ctx, instrumentName, {
      format: 'mp3',
      soundfont: 'MusyngKite',
      gain: 3.0 // Adjust volume
    });

    // Cache the loaded instrument
    instrumentCache[cacheKey] = instrument;

    return instrument;
  } catch (error) {
    console.error(`Error loading instrument ${instrumentName}:`, error);

    // Try loading a fallback instrument if requested
    if (tryFallback && instrumentName !== 'acoustic_grand_piano') {
      console.warn(`Falling back to piano for failed instrument: ${instrumentName}`);
      return loadInstrument('acoustic_grand_piano', ctx, false);
    }

    throw new SoundFontError(
      `Failed to load instrument: ${instrumentName}`, 
      error
    );
  }
};

/**
 * Get a list of available instrument names
 * @returns {Object} - Object with instrument names and their display names
 */
export const getAvailableInstruments = () => {
  return {
    'acoustic_grand_piano': 'Piano',
    'electric_piano_1': 'Electric Piano',
    'electric_guitar_clean': 'Electric Guitar',
    'acoustic_guitar_nylon': 'Acoustic Guitar',
    'acoustic_guitar_steel': 'Steel Guitar',
    'electric_bass_finger': 'Bass Guitar',
    'violin': 'Violin',
    'cello': 'Cello',
    'flute': 'Flute',
    'clarinet': 'Clarinet',
    'saxophone': 'Saxophone',
    'trumpet': 'Trumpet',
    'french_horn': 'French Horn',
    'trombone': 'Trombone',
    'choir_aahs': 'Choir',
    'string_ensemble_1': 'String Ensemble',
    'synth_strings_1': 'Synth Strings',
    'synth_pad_2_warm': 'Warm Pad',
    'church_organ': 'Church Organ'
  };
};

/**
 * Map General MIDI program number to SoundFont instrument name
 * @param {number} program - MIDI program number (0-127)
 * @returns {string} - SoundFont instrument name
 */
export const midiProgramToInstrumentName = (program) => {
  const instrumentMap = {
    0: 'acoustic_grand_piano',
    1: 'bright_acoustic_piano',
    2: 'electric_grand_piano',
    3: 'honkytonk_piano',
    4: 'electric_piano_1',
    5: 'electric_piano_2',
    6: 'harpsichord',
    7: 'clavinet',
    8: 'celesta',
    9: 'glockenspiel',
    10: 'music_box',
    11: 'vibraphone',
    12: 'marimba',
    13: 'xylophone',
    14: 'tubular_bells',
    15: 'dulcimer',
    16: 'drawbar_organ',
    17: 'percussive_organ',
    18: 'rock_organ',
    19: 'church_organ',
    20: 'reed_organ',
    21: 'accordion',
    22: 'harmonica',
    23: 'tango_accordion',
    24: 'acoustic_guitar_nylon',
    25: 'acoustic_guitar_steel',
    26: 'electric_guitar_jazz',
    27: 'electric_guitar_clean',
    28: 'electric_guitar_muted',
    29: 'overdriven_guitar',
    30: 'distortion_guitar',
    31: 'guitar_harmonics',
    32: 'acoustic_bass',
    33: 'electric_bass_finger',
    34: 'electric_bass_pick',
    35: 'fretless_bass',
    36: 'slap_bass_1',
    37: 'slap_bass_2',
    38: 'synth_bass_1',
    39: 'synth_bass_2',
    40: 'violin',
    41: 'viola',
    42: 'cello',
    43: 'contrabass',
    44: 'tremolo_strings',
    45: 'pizzicato_strings',
    46: 'orchestral_harp',
    47: 'timpani',
    48: 'string_ensemble_1',
    49: 'string_ensemble_2',
    50: 'synth_strings_1',
    51: 'synth_strings_2',
    52: 'choir_aahs',
    53: 'voice_oohs',
    54: 'synth_choir',
    55: 'orchestra_hit',
    56: 'trumpet',
    57: 'trombone',
    58: 'tuba',
    59: 'muted_trumpet',
    60: 'french_horn',
    61: 'brass_section',
    62: 'synth_brass_1',
    63: 'synth_brass_2',
    64: 'soprano_sax',
    65: 'alto_sax',
    66: 'tenor_sax',
    67: 'baritone_sax',
    68: 'oboe',
    69: 'english_horn',
    70: 'bassoon',
    71: 'clarinet',
    72: 'piccolo',
    73: 'flute',
    74: 'recorder',
    75: 'pan_flute',
    76: 'blown_bottle',
    77: 'shakuhachi',
    78: 'whistle',
    79: 'ocarina',
    80: 'lead_1_square',
    81: 'lead_2_sawtooth',
    82: 'lead_3_calliope',
    83: 'lead_4_chiff',
    84: 'lead_5_charang',
    85: 'lead_6_voice',
    86: 'lead_7_fifths',
    87: 'lead_8_bass_lead',
    88: 'pad_1_new_age',
    89: 'pad_2_warm',
    90: 'pad_3_polysynth',
    91: 'pad_4_choir',
    92: 'pad_5_bowed',
    93: 'pad_6_metallic',
    94: 'pad_7_halo',
    95: 'pad_8_sweep',
    96: 'fx_1_rain',
    97: 'fx_2_soundtrack',
    98: 'fx_3_crystal',
    99: 'fx_4_atmosphere',
    100: 'fx_5_brightness',
    101: 'fx_6_goblins',
    102: 'fx_7_echoes',
    103: 'fx_8_sci_fi',
    104: 'sitar',
    105: 'banjo',
    106: 'shamisen',
    107: 'koto',
    108: 'kalimba',
    109: 'bagpipe',
    110: 'fiddle',
    111: 'shanai',
    112: 'tinkle_bell',
    113: 'agogo',
    114: 'steel_drums',
    115: 'woodblock',
    116: 'taiko_drum',
    117: 'melodic_tom',
    118: 'synth_drum',
    119: 'reverse_cymbal',
    120: 'guitar_fret_noise',
    121: 'breath_noise',
    122: 'seashore',
    123: 'bird_tweet',
    124: 'telephone_ring',
    125: 'helicopter',
    126: 'applause',
    127: 'gunshot'
  };

  return instrumentMap[program] || 'acoustic_grand_piano';
};

/**
 * Play a melody using a SoundFont instrument
 * @param {Object} instrument - SoundFont instrument player
 * @param {Array} notes - Array of note objects with pitch, duration, velocity, startTime
 * @param {number} tempo - Tempo in BPM
 * @returns {Promise<void>}
 * @throws {SoundFontError} - If playback fails
 */
export const playMelodyWithSoundFont = async (instrument, notes, tempo = 120) => {
  // Validate parameters
  if (!instrument) {
    throw new SoundFontError('No instrument provided for playback');
  }

  if (!notes || !Array.isArray(notes) || notes.length === 0) {
    console.warn('No notes provided for playback');
    return Promise.resolve(); // Return resolved promise for empty playback
  }

  if (!instrument.context) {
    throw new SoundFontError('Invalid instrument: missing audio context');
  }

  try {
    // Resume audio context if it's suspended (autoplay policy)
    if (instrument.context.state === 'suspended') {
      await instrument.context.resume();
    }

    const secondsPerBeat = 60 / Math.max(1, tempo); // Ensure tempo is at least 1 BPM
    const now = instrument.context.currentTime;

    // Schedule all notes with error handling for each note
    const scheduledNotes = notes.map(note => {
      try {
        if (!note || !note.pitch) {
          console.warn('Invalid note skipped during playback:', note);
          return Promise.resolve(); // Skip invalid notes
        }

        const startTime = now + ((note.startTime || 0) * secondsPerBeat);
        const duration = (note.duration || 1) * secondsPerBeat;
        const velocity = note.velocity || 1.0;

        return instrument.play(note.pitch, startTime, { duration, gain: velocity });
      } catch (noteError) {
        console.error('Error scheduling note:', noteError, note);
        return Promise.resolve(); // Continue with other notes
      }
    });

    // Return a promise that resolves when all notes have finished playing
    return Promise.all(scheduledNotes);
  } catch (error) {
    console.error('Error during melody playback:', error);
    throw new SoundFontError('Failed to play melody', error);
  }
};

/**
 * Play a chord progression using a SoundFont instrument
 * @param {Object} instrument - SoundFont instrument player
 * @param {Array} chords - Array of chord objects with notes, duration, position
 * @param {number} tempo - Tempo in BPM
 * @returns {Promise<void>}
 * @throws {SoundFontError} - If playback fails
 */
export const playChordProgressionWithSoundFont = async (instrument, chords, tempo = 120) => {
  // Validate parameters
  if (!instrument) {
    throw new SoundFontError('No instrument provided for chord playback');
  }

  if (!chords || !Array.isArray(chords) || chords.length === 0) {
    console.warn('No chords provided for playback');
    return Promise.resolve(); // Return resolved promise for empty playback
  }

  if (!instrument.context) {
    throw new SoundFontError('Invalid instrument: missing audio context');
  }

  try {
    // Resume audio context if it's suspended (autoplay policy)
    if (instrument.context.state === 'suspended') {
      await instrument.context.resume();
    }

    const secondsPerBeat = 60 / Math.max(1, tempo); // Ensure tempo is at least 1 BPM
    const now = instrument.context.currentTime;

    // Schedule all chords with error handling
    const scheduledChords = [];

    for (const chord of chords) {
      try {
        if (!chord || !chord.notes || !Array.isArray(chord.notes) || chord.notes.length === 0) {
          console.warn('Invalid chord skipped during playback:', chord);
          continue; // Skip invalid chords
        }

        const startTime = now + ((chord.position || 0) * 4 * secondsPerBeat); // 4 beats per bar
        const duration = (chord.duration || 1) * 4 * secondsPerBeat;

        // Play each note in the chord
        for (const note of chord.notes) {
          try {
            if (!note) {
              console.warn('Invalid note in chord skipped during playback');
              continue; // Skip invalid notes
            }

            scheduledChords.push(
              instrument.play(note, startTime, { duration, gain: 0.8 })
            );
          } catch (noteError) {
            console.error('Error scheduling chord note:', noteError, note);
            // Continue with other notes
          }
        }
      } catch (chordError) {
        console.error('Error scheduling chord:', chordError, chord);
        // Continue with other chords
      }
    }

    // Return a promise that resolves when all chords have finished playing
    return Promise.all(scheduledChords);
  } catch (error) {
    console.error('Error during chord progression playback:', error);
    throw new SoundFontError('Failed to play chord progression', error);
  }
};

/**
 * Stop all currently playing sounds
 * @param {Object} instrument - SoundFont instrument player
 * @returns {boolean} - Whether the stop operation was successful
 */
export const stopAllSounds = (instrument) => {
  if (!instrument) {
    console.warn('No instrument provided to stop sounds');
    return false;
  }

  try {
    if (typeof instrument.stop === 'function') {
      instrument.stop();
      return true;
    } else {
      console.warn('Instrument does not have a stop method');

      // Try alternative stopping method if available
      if (instrument.context && typeof instrument.context.suspend === 'function') {
        instrument.context.suspend();
        console.info('Used audio context suspend as fallback for stopping sounds');
        return true;
      }
    }
  } catch (error) {
    console.error('Error stopping sounds:', error);
  }

  return false;
};
