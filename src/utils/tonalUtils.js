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
export const getScaleTypes = () => Scale.names();

/**
 * Get all available keys
 * @returns {string[]} - Array of key names
 */
export const getKeys = () => Key.names();

/**
 * Generate a chord from a chord symbol
 * @param {string} chordSymbol - Chord symbol (e.g., 'Cmaj7', 'Dm9')
 * @param {number} octave - Base octave for the chord
 * @returns {string[]} - Array of note names in the chord
 */
export const getChordNotes = (chordSymbol, octave = 4) => {
  if (!chordSymbol || chordSymbol.trim() === '') {
    return ['C4', 'E4', 'G4'];
  }

  const chord = Chord.get(chordSymbol);

  if (!chord || !chord.notes || chord.notes.length === 0) {
    return ['C4', 'E4', 'G4'];
  }

  const result = chord.notes.map((note, index) => {
    const noteOctave = octave + Math.floor(index / 7);
    return `${note}${noteOctave}`;
  });

  return result;
};

/**
 * Get chord from scale degree
 * @param {string} key - Key (e.g., 'C major', 'A minor')
 * @param {string} degree - Scale degree (e.g., 'I', 'ii', 'V7')
 * @returns {string} - Chord symbol
 */
export const getChordFromDegree = (key, degree) => Progression.fromRomanNumerals(key, [degree])[0];

/**
 * Get all chords in a key
 * @param {string} key - Key (e.g., 'C major', 'A minor')
 * @returns {Object[]} - Array of chord objects with symbol and degree
 */
export const getChordsInKey = key => {
  const keyObj = Key.majorKey(key.split(' ')[0]);

  return keyObj.chords.map((chord, index) => ({
    symbol: chord,
    degree: keyObj.grades[index],
  }));
};

/**
 * Get common chord progressions
 * @returns {Object} - Object with progression names and their Roman numeral patterns
 */
export const getCommonProgressions = () => ({
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
  Hopeful: ['I', 'iii', 'vi', 'IV'],
  Mysterious: ['i', 'VII', 'VI', 'v'],
  Heroic: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'],
  Nostalgic: ['IV', 'V', 'iii', 'vi'],
  Suspenseful: ['i', 'V', 'VI', 'III'],
  Triumphant: ['I', 'IV', 'V', 'I', 'IV', 'I', 'V', 'I'],
});

/**
 * Generate a chord progression in a key
 * @param {string} key - Key (e.g., 'C major', 'A minor')
 * @param {string[]} progression - Array of Roman numeral chord degrees
 * @param {boolean} extended - Whether to use extended chords
 * @returns {Object[]} - Array of chord objects with symbol, notes, and degree
 */
export const generateChordProgression = (key, progression, extended = false) => {
  const [tonic, mode] = key.split(' ');

  let chordSymbols = [];
  try {
    chordSymbols = Progression.fromRomanNumerals(key, progression);
    if (
      !chordSymbols ||
      chordSymbols.length === 0 ||
      chordSymbols.includes(undefined) ||
      chordSymbols.includes(null) ||
      chordSymbols.includes('')
    ) {
      throw new Error('Invalid chord symbols generated');
    }
  } catch (error) {
    if (mode === 'major' || mode === 'Major') {
      try {
        const scale = Scale.get(`${tonic} major`).notes;
        if (scale && scale.length >= 7) {
          chordSymbols = [
            scale[0] + 'maj', // I chord
            scale[3] + 'maj', // IV chord
            scale[4] + 'maj', // V chord
            scale[0] + 'maj', // I chord
          ];
        } else {
          chordSymbols = [tonic + 'maj', tonic + 'maj7', tonic + '7', tonic + 'maj'];
        }
      } catch (error) {
        chordSymbols = [tonic + 'maj', tonic + 'maj7', tonic + '7', tonic + 'maj'];
      }
    } else {
      try {
        const scale = Scale.get(`${tonic} minor`).notes;
        if (scale && scale.length >= 7) {
          chordSymbols = [
            scale[0] + 'm', // i chord
            scale[3] + 'm', // iv chord
            scale[4] + 'maj', // V chord (major in minor key)
            scale[0] + 'm', // i chord
          ];
        } else {
          chordSymbols = [tonic + 'm', tonic + 'm7', tonic + 'dim', tonic + 'm'];
        }
      } catch (error) {
        chordSymbols = [tonic + 'm', tonic + 'm7', tonic + 'dim', tonic + 'm'];
      }
    }
  }

  while (chordSymbols.length < progression.length) {
    chordSymbols.push(...chordSymbols.slice(0, progression.length - chordSymbols.length));
  }

  if (chordSymbols.length > progression.length) {
    chordSymbols = chordSymbols.slice(0, progression.length);
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
    const notes = getChordNotes(finalSymbol);

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
      type: type || 'maj', // Default to 'maj' if type is empty
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
  const newOctave =
    octave + Math.floor((Note.get(noteName).midi + semitones - Note.get(transposed).midi) / 12);

  return `${transposed}${newOctave}`;
};

/**
 * Get note properties
 * @param {string} note - Note name (e.g., 'C4')
 * @returns {Object} - Note properties including midi number, frequency, etc.
 */
export const getNoteProperties = note => {
  const noteName = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));

  const noteObj = Note.get(noteName);
  const midi = noteObj.midi + (octave - 4) * 12;

  return {
    name: noteName,
    octave,
    midi,
    frequency: Note.freq(note),
    chroma: noteObj.chroma,
  };
};
