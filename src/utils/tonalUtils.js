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
  // Get the chord notes using Tonal.js
  const chord = Chord.get(chordSymbol);
  
  // Add octave information to each note
  return chord.notes.map((note, index) => {
    // For extended chords, we might need to adjust octaves for better voicing
    const noteOctave = octave + Math.floor(index / 7);
    return `${note}${noteOctave}`;
  });
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
    'Basic I-IV-V-I': ['I', 'IV', 'V', 'I'],
    'Pop I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
    'Jazz ii-V-I': ['ii', 'V', 'I'],
    'Blues I-IV-I-V-IV-I': ['I', 'IV', 'I', 'V', 'IV', 'I'],
    '50s I-vi-IV-V': ['I', 'vi', 'IV', 'V'],
    'Circle of Fifths': ['vi', 'ii', 'V', 'I'],
    'Emotional vi-IV-I-V': ['vi', 'IV', 'I', 'V']
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
  // Convert Roman numerals to chord symbols
  const chordSymbols = Progression.fromRomanNumerals(key, progression);
  
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
    const notes = getChordNotes(finalSymbol);
    
    return {
      symbol: finalSymbol,
      degree: progression[index],
      notes
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