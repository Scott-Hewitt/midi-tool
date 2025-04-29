// Tonal.js integration for enhanced music theory capabilities
import * as Tonal from 'tonal';
import { Scale, Chord, Note, Key, Progression } from 'tonal';

/**
 * Get all notes in a scale
 * @param {string} scaleName - Scale name (e.g., 'C major', 'A minor')
 * @param {number} octave - Base octave for the scale
 * @returns {string[]} - Array of note names in the scale
 */
export const getScaleNotes = (scaleName, octave = 4) => {
  // Parse the scale name to get the tonic and scale type
  const [tonic, type] = scaleName.split(' ');

  // Get the scale notes using Tonal.js
  const scaleNotes = Scale.get(`${tonic} ${type}`).notes;

  // Add octave information to each note
  return scaleNotes.map((note, index) => {
    // For scales that span more than an octave, increment the octave
    const noteOctave = octave + Math.floor((index + Note.get(tonic).chroma) / 12);
    return `${note}${noteOctave}`;
  });
};

/**
 * Get all available scale types
 * @returns {string[]} - Array of scale types
 */
export const getScaleTypes = () => {
  return Scale.names();
};

/**
 * Get all available keys
 * @returns {string[]} - Array of key names
 */
export const getKeys = () => {
  return Key.names();
};

/**
 * Generate a chord from a chord symbol
 * @param {string} chordSymbol - Chord symbol (e.g., 'Cmaj7', 'Dm9')
 * @param {number} octave - Base octave for the chord
 * @returns {string[]} - Array of note names in the chord
 */
export const getChordNotes = (chordSymbol, octave = 4) => {
  console.log(`getChordNotes called with symbol: ${chordSymbol}, octave: ${octave}`);

  // Get the chord notes using Tonal.js
  const chord = Chord.get(chordSymbol);
  console.log('Chord object from Tonal.js:', chord);

  // Check if we have valid notes
  if (!chord || !chord.notes || chord.notes.length === 0) {
    console.error(`No notes found for chord symbol: ${chordSymbol}`);
    // Return a default C major chord as fallback
    return ['C4', 'E4', 'G4'];
  }

  // Add octave information to each note
  const result = chord.notes.map((note, index) => {
    // For extended chords, we might need to adjust octaves for better voicing
    const noteOctave = octave + Math.floor(index / 7);
    return `${note}${noteOctave}`;
  });

  console.log(`Final notes for ${chordSymbol}:`, result);
  return result;
};

/**
 * Get chord from scale degree
 * @param {string} key - Key (e.g., 'C major', 'A minor')
 * @param {string} degree - Scale degree (e.g., 'I', 'ii', 'V7')
 * @returns {string} - Chord symbol
 */
export const getChordFromDegree = (key, degree) => {
  return Progression.fromRomanNumerals(key, [degree])[0];
};

/**
 * Get all chords in a key
 * @param {string} key - Key (e.g., 'C major', 'A minor')
 * @returns {Object[]} - Array of chord objects with symbol and degree
 */
export const getChordsInKey = (key) => {
  const keyObj = Key.majorKey(key.split(' ')[0]);

  return keyObj.chords.map((chord, index) => ({
    symbol: chord,
    degree: keyObj.grades[index]
  }));
};

/**
 * Get common chord progressions
 * @returns {Object} - Object with progression names and their Roman numeral patterns
 */
export const getCommonProgressions = () => {
  return {
    // Basic progressions
    'Basic I-IV-V-I': ['I', 'IV', 'V', 'I'],
    'Pop I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
    'Jazz ii-V-I': ['ii', 'V', 'I'],
    'Blues I-IV-I-V-IV-I': ['I', 'IV', 'I', 'V', 'IV', 'I'],
    '50s I-vi-IV-V': ['I', 'vi', 'IV', 'V'],
    'Circle of Fifths': ['vi', 'ii', 'V', 'I'],
    'Emotional vi-IV-I-V': ['vi', 'IV', 'I', 'V'],

    // Additional progressions
    'Canon (Pachelbel)': ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    'Andalusian Cadence': ['i', 'VII', 'VI', 'V'],
    'Royal Road': ['I', 'vi', 'ii', 'V'],
    'Creep (Radiohead)': ['I', 'III', 'IV', 'iv'],
    'Doo-Wop': ['I', 'vi', 'IV', 'V', 'I'],
    'Sad Ballad': ['vi', 'IV', 'ii', 'V'],
    'Epic Journey': ['I', 'V', 'vi', 'iii', 'IV', 'I', 'V'],
    'Dramatic Minor': ['i', 'VI', 'III', 'VII'],
    'Hopeful': ['I', 'iii', 'vi', 'IV'],
    'Mysterious': ['i', 'VII', 'VI', 'v'],
    'Heroic': ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'],
    'Nostalgic': ['IV', 'V', 'iii', 'vi'],
    'Suspenseful': ['i', 'V', 'VI', 'III'],
    'Triumphant': ['I', 'IV', 'V', 'I', 'IV', 'I', 'V', 'I']
  };
};

/**
 * Generate a chord progression in a key
 * @param {string} key - Key (e.g., 'C major', 'A minor')
 * @param {string[]} progression - Array of Roman numeral chord degrees
 * @param {boolean} extended - Whether to use extended chords
 * @returns {Object[]} - Array of chord objects with symbol, notes, and degree
 */
export const generateChordProgression = (key, progression, extended = false) => {
  console.log('Generating chord progression in key:', key);
  console.log('Progression pattern:', progression);

  // Parse the key to get the tonic
  const [tonic, mode] = key.split(' ');
  console.log(`Parsed key: tonic=${tonic}, mode=${mode}`);

  // Convert Roman numerals to chord symbols
  let chordSymbols = [];
  try {
    // Try using Tonal.js Progression.fromRomanNumerals
    chordSymbols = Progression.fromRomanNumerals(key, progression);
    console.log('Chord symbols from Tonal.js:', chordSymbols);

    // Check if we got valid chord symbols
    if (!chordSymbols || chordSymbols.length === 0 || chordSymbols.every(symbol => symbol === chordSymbols[0])) {
      throw new Error('Invalid chord symbols or all symbols are the same');
    }
  } catch (error) {
    console.error('Error converting Roman numerals to chord symbols:', error);

    // Manually create chord symbols based on the progression pattern and key
    chordSymbols = [];

    // Get the scale notes for this key
    const scale = Scale.get(`${tonic} ${mode}`);
    console.log('Scale notes:', scale.notes);

    // Map Roman numerals to scale degrees
    progression.forEach(degree => {
      let scaleIndex = 0;
      let chordType = 'maj';

      // Parse the Roman numeral
      if (degree.toLowerCase() === 'i') {
        scaleIndex = 0;
        chordType = mode === 'minor' ? 'min' : 'maj';
      } else if (degree.toLowerCase() === 'ii') {
        scaleIndex = 1;
        chordType = mode === 'minor' ? 'dim' : 'min';
      } else if (degree.toLowerCase() === 'iii') {
        scaleIndex = 2;
        chordType = mode === 'minor' ? 'maj' : 'min';
      } else if (degree.toLowerCase() === 'iv') {
        scaleIndex = 3;
        chordType = mode === 'minor' ? 'min' : 'maj';
      } else if (degree.toLowerCase() === 'v') {
        scaleIndex = 4;
        chordType = mode === 'minor' ? 'min' : 'maj';
      } else if (degree.toLowerCase() === 'vi') {
        scaleIndex = 5;
        chordType = mode === 'minor' ? 'maj' : 'min';
      } else if (degree.toLowerCase() === 'vii') {
        scaleIndex = 6;
        chordType = mode === 'minor' ? 'maj' : 'dim';
      }

      // Get the root note for this degree
      const rootNote = scale.notes[scaleIndex];

      // Create the chord symbol
      let chordSymbol = rootNote;
      if (chordType === 'min') {
        chordSymbol += 'm';
      } else if (chordType === 'dim') {
        chordSymbol += 'dim';
      } else if (chordType === 'aug') {
        chordSymbol += 'aug';
      }

      chordSymbols.push(chordSymbol);
    });

    console.log('Manually created chord symbols:', chordSymbols);
  }

  // Generate chord objects
  return chordSymbols.map((symbol, index) => {
    // If extended chords are requested, modify the chord symbols
    let finalSymbol = symbol;
    if (extended) {
      // Convert triads to seventh chords or better
      if (symbol.endsWith('m') && !symbol.includes('dim')) {
        finalSymbol = `${symbol}7`;
      } else if (!symbol.includes('7') && !symbol.includes('9')) {
        finalSymbol = `${symbol}maj7`;
      }
    }

    // Get the notes for this chord
    console.log(`Getting notes for chord symbol: ${finalSymbol}`);
    const notes = getChordNotes(finalSymbol);
    console.log(`Notes for ${finalSymbol}:`, notes);

    // Extract root note (first letter possibly followed by # or b)
    const rootMatch = finalSymbol.match(/^[A-G][#b]?/);
    const root = rootMatch ? rootMatch[0] : finalSymbol.substring(0, 1);

    // Extract chord type
    const type = finalSymbol.replace(/^[A-G][#b]?/, '');

    return {
      symbol: finalSymbol,
      degree: progression[index],
      notes,
      root,
      type: type || 'maj' // Default to 'maj' if type is empty
    };
  });
};

/**
 * Transpose a note by a number of semitones
 * @param {string} note - Note name (e.g., 'C4')
 * @param {number} semitones - Number of semitones to transpose
 * @returns {string} - Transposed note
 */
export const transposeNote = (note, semitones) => {
  // Split note name and octave
  const noteName = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));

  // Transpose using Tonal.js
  const transposed = Note.transpose(noteName, Tonal.Interval.fromSemitones(semitones));

  // Calculate new octave
  const newOctave = octave + Math.floor((Note.get(noteName).midi + semitones - Note.get(transposed).midi) / 12);

  return `${transposed}${newOctave}`;
};

/**
 * Get note properties
 * @param {string} note - Note name (e.g., 'C4')
 * @returns {Object} - Note properties including midi number, frequency, etc.
 */
export const getNoteProperties = (note) => {
  const noteName = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));

  const noteObj = Note.get(noteName);
  const midi = noteObj.midi + (octave - 4) * 12;

  return {
    name: noteName,
    octave,
    midi,
    frequency: Note.freq(note),
    chroma: noteObj.chroma
  };
};