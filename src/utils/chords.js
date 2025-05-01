// Advanced chord functions for chord generation

/**
 * Extended chord types with intervals
 */
export const extendedChordTypes = {
  // Basic chord types
  'maj': [0, 4, 7],       // Major: root, major third, perfect fifth
  'min': [0, 3, 7],       // Minor: root, minor third, perfect fifth
  '7': [0, 4, 7, 10],     // Dominant 7th: root, major third, perfect fifth, minor seventh
  'maj7': [0, 4, 7, 11],  // Major 7th: root, major third, perfect fifth, major seventh
  'min7': [0, 3, 7, 10],  // Minor 7th: root, minor third, perfect fifth, minor seventh
  'dim': [0, 3, 6],       // Diminished: root, minor third, diminished fifth
  'aug': [0, 4, 8],       // Augmented: root, major third, augmented fifth
  'sus4': [0, 5, 7],      // Suspended 4th: root, perfect fourth, perfect fifth

  // Extended chord types
  'dom9': [0, 4, 7, 10, 14],  // Dominant 9th: root, major third, perfect fifth, minor seventh, major ninth
  'maj9': [0, 4, 7, 11, 14],  // Major 9th: root, major third, perfect fifth, major seventh, major ninth
  'min9': [0, 3, 7, 10, 14],  // Minor 9th: root, minor third, perfect fifth, minor seventh, major ninth
  'add9': [0, 4, 7, 14],      // Add9: root, major third, perfect fifth, major ninth
  'sus2': [0, 2, 7],          // Suspended 2nd: root, major second, perfect fifth
  '7sus4': [0, 5, 7, 10],     // 7sus4: root, perfect fourth, perfect fifth, minor seventh
  '7b9': [0, 4, 7, 10, 13],   // 7flat9: root, major third, perfect fifth, minor seventh, minor ninth
  '7#9': [0, 4, 7, 10, 15],   // 7sharp9: root, major third, perfect fifth, minor seventh, augmented ninth
  '13': [0, 4, 7, 10, 14, 21], // 13th: root, major third, perfect fifth, minor seventh, major ninth, major thirteenth
  '6': [0, 4, 7, 9],          // Major 6th: root, major third, perfect fifth, major sixth
  'min6': [0, 3, 7, 9],       // Minor 6th: root, minor third, perfect fifth, major sixth
  '9sus4': [0, 5, 7, 10, 14], // 9sus4: root, perfect fourth, perfect fifth, minor seventh, major ninth
  'dim7': [0, 3, 6, 9],       // Diminished 7th: root, minor third, diminished fifth, diminished seventh
  'hdim7': [0, 3, 6, 10],     // Half-diminished 7th: root, minor third, diminished fifth, minor seventh
  'aug7': [0, 4, 8, 10],      // Augmented 7th: root, major third, augmented fifth, minor seventh
  'augmaj7': [0, 4, 8, 11]    // Augmented major 7th: root, major third, augmented fifth, major seventh
};

/**
 * Advanced chord progressions with chord types
 */
export const advancedProgressions = {
  'Basic I-IV-V-I': {
    progression: ['I', 'IV', 'V', 'I'],
    chordTypes: ['maj', 'maj', 'maj', 'maj']
  },
  'Pop I-V-vi-IV': {
    progression: ['I', 'V', 'vi', 'IV'],
    chordTypes: ['maj', 'maj', 'min', 'maj']
  },
  'Jazz ii-V-I': {
    progression: ['ii', 'V', 'I'],
    chordTypes: ['min7', '7', 'maj7']
  },
  'Jazz ii-V-I with 9ths': {
    progression: ['ii', 'V', 'I'],
    chordTypes: ['min9', 'dom9', 'maj9']
  },
  'Blues I-IV-I-V-IV-I': {
    progression: ['I', 'IV', 'I', 'V', 'IV', 'I'],
    chordTypes: ['7', '7', '7', '7', '7', '7']
  },
  'Secondary Dominant': {
    progression: ['I', 'V/V', 'V', 'I'],
    chordTypes: ['maj', '7', '7', 'maj']
  },
  'Modal Mixture': {
    progression: ['I', 'bVI', 'bVII', 'I'],
    chordTypes: ['maj', 'maj', 'maj', 'maj']
  },
  'Circle of Fifths': {
    progression: ['vi', 'ii', 'V', 'I'],
    chordTypes: ['min7', 'min7', '7', 'maj7']
  },
  'Descending Fifths': {
    progression: ['I', 'IV', 'vii°', 'iii', 'vi', 'ii', 'V', 'I'],
    chordTypes: ['maj7', 'maj7', 'dim7', 'min7', 'min7', 'min7', '7', 'maj7']
  }
};

/**
 * Chord degrees in major keys
 */
export const majorDegrees = {
  'I': 0,   // Tonic
  'ii': 2,  // Supertonic
  'iii': 4, // Mediant
  'IV': 5,  // Subdominant
  'V': 7,   // Dominant
  'vi': 9,  // Submediant
  'vii°': 11, // Leading tone
  'bIII': 3, // Flat third (borrowed from minor)
  'bVI': 8, // Flat sixth (borrowed from minor)
  'bVII': 10, // Flat seventh (borrowed from minor)
  'V/V': 2,  // Secondary dominant (V of V)
  'V/vi': 4, // Secondary dominant (V of vi)
  'V/IV': 0  // Secondary dominant (V of IV)
};

/**
 * Convert note name to MIDI note number
 * @param {string} noteName - Note name (e.g., 'C4')
 * @returns {number} - MIDI note number
 */
export const noteToMidi = (noteName) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const [note, octave] = [noteName.slice(0, -1), parseInt(noteName.slice(-1))];
  return notes.indexOf(note) + (octave + 1) * 12;
};

/**
 * Convert MIDI note number to note name
 * @param {number} midiNumber - MIDI note number
 * @returns {string} - Note name
 */
export const midiToNote = (midiNumber) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const note = notes[midiNumber % 12];
  return `${note}${octave}`;
};

/**
 * Generate a chord based on root note and chord type
 * @param {string} rootNote - Root note (e.g., 'C4')
 * @param {string} chordType - Chord type (e.g., 'maj', 'min7')
 * @returns {string[]} - Array of note names in the chord
 */
export const generateChord = (rootNote, chordType) => {
  const rootMidi = noteToMidi(rootNote);
  return (extendedChordTypes[chordType] || extendedChordTypes.maj).map(
    interval => midiToNote(rootMidi + interval)
  );
};

/**
 * Get chord inversion
 * @param {string} rootNote - Root note (e.g., 'C4')
 * @param {string} chordType - Chord type (e.g., 'maj', 'min7')
 * @param {number} inversion - Inversion number (0 = root position, 1 = first inversion, etc.)
 * @returns {string[]} - Array of note names in the inverted chord
 */
export const getChordInversion = (rootNote, chordType, inversion) => {
  const baseChord = generateChord(rootNote, chordType);
  const midiNotes = baseChord.map(note => noteToMidi(note));

  // Apply inversion
  for (let i = 0; i < inversion; i++) {
    const bass = midiNotes.shift();
    midiNotes.push(bass + 12); // Move bottom note up an octave
  }

  return midiNotes.map(midi => midiToNote(midi));
};

/**
 * Generate different voicings for a chord
 * @param {string} rootNote - Root note (e.g., 'C4')
 * @param {string} chordType - Chord type (e.g., 'maj', 'min7')
 * @returns {Array<string[]>} - Array of chord voicings
 */
export const generateChordVoicings = (rootNote, chordType) => {
  const voicings = [];
  const intervals = extendedChordTypes[chordType] || extendedChordTypes.maj;

  // Base voicing
  voicings.push(generateChord(rootNote, chordType));

  // Inversions
  for (let i = 1; i < intervals.length; i++) {
    voicings.push(getChordInversion(rootNote, chordType, i));
  }

  // Spread voicing (wider intervals)
  const spreadVoicing = [];
  const rootMidi = noteToMidi(rootNote);
  intervals.forEach((interval, idx) => {
    spreadVoicing.push(midiToNote(rootMidi + interval + (idx > 0 ? 12 : 0)));
  });
  voicings.push(spreadVoicing);

  return voicings;
};

/**
 * Calculate total movement between two chord voicings
 * @param {string[]} voicing1 - First chord voicing
 * @param {string[]} voicing2 - Second chord voicing
 * @returns {number} - Total movement in semitones
 */
export const calculateTotalMovement = (voicing1, voicing2) => {
  let totalMovement = 0;
  for (let i = 0; i < Math.min(voicing1.length, voicing2.length); i++) {
    const note1 = noteToMidi(voicing1[i]);
    const note2 = noteToMidi(voicing2[i]);
    totalMovement += Math.abs(note1 - note2);
  }
  return totalMovement;
};

/**
 * Apply voice leading for smoother chord transitions
 * @param {Array} chords - Array of chord objects
 * @returns {Array} - Chords with voice leading applied
 */
export const applyVoiceLeading = (chords) => {
  const voiceLedChords = [];
  let previousVoicing = null;

  chords.forEach(chord => {
    if (!previousVoicing) {
      // For the first chord, use the default voicing
      previousVoicing = chord.notes;
      voiceLedChords.push(chord);
    } else {
      let rootNote;
      if (chord.root) {
        rootNote = chord.root + '4';
      } else {
        const rootMatch = chord.symbol ? chord.symbol.match(/^[A-G][#b]?/) : null;
        rootNote = rootMatch ? rootMatch[0] + '4' : 'C4';
      }

      let chordType;
      if (chord.type) {
        chordType = chord.type;
      } else if (chord.symbol) {
        chordType = 'maj';
        if (chord.symbol.includes('m7')) {
          chordType = 'min7';
        } else if (chord.symbol.includes('maj7')) {
          chordType = 'maj7';
        } else if (chord.symbol.includes('7')) {
          chordType = '7';
        } else if (chord.symbol.includes('m')) {
          chordType = 'min';
        } else if (chord.symbol.includes('dim')) {
          chordType = 'dim';
        } else if (chord.symbol.includes('aug')) {
          chordType = 'aug';
        }
      } else {
        chordType = 'maj';
      }

      // Find the closest voicing to the previous chord
      const possibleVoicings = generateChordVoicings(rootNote, chordType);
      let bestVoicing = possibleVoicings[0];
      let smallestMovement = calculateTotalMovement(previousVoicing, bestVoicing);

      possibleVoicings.forEach(voicing => {
        const movement = calculateTotalMovement(previousVoicing, voicing);
        if (movement < smallestMovement) {
          smallestMovement = movement;
          bestVoicing = voicing;
        }
      });

      // Use the best voicing
      const voiceLedChord = {...chord, notes: bestVoicing};
      voiceLedChords.push(voiceLedChord);
      previousVoicing = bestVoicing;
    }
  });

  return voiceLedChords;
};

/**
 * Get the root note of a secondary dominant chord
 * @param {string} degree - Chord degree (e.g., 'V/V')
 * @param {string} key - Key (e.g., 'C')
 * @returns {number} - MIDI note number of the root
 */
export const getSecondaryDominantRoot = (degree, key) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyIndex = notes.indexOf(key.split('/')[0]);

  // Parse the secondary dominant notation (e.g., 'V/V')
  const [dominantDegree, targetDegree] = degree.split('/');

  // Get the root of the target chord
  const targetRoot = (keyIndex + majorDegrees[targetDegree]) % 12;

  // Calculate the dominant of that chord (fifth above)
  const dominantRoot = (targetRoot + 7) % 12;

  return dominantRoot;
};