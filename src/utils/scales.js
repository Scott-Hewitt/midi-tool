// Advanced scales and modes for melody and chord generation

// Major modes
export const majorModes = {
  'Ionian (Major)': [0, 2, 4, 5, 7, 9, 11], // Major scale
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  'Aeolian (Minor)': [0, 2, 3, 5, 7, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10],
};

// Pentatonic scales
export const pentatonicScales = {
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  Blues: [0, 3, 5, 6, 7, 10],
};

// Other scales
export const otherScales = {
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Whole Tone': [0, 2, 4, 6, 8, 10],
  Diminished: [0, 2, 3, 5, 6, 8, 9, 11],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

// World and exotic scales
export const worldScales = {
  'Hungarian Minor': [0, 2, 3, 6, 7, 8, 11],
  'Double Harmonic': [0, 1, 4, 5, 7, 8, 11], // aka Byzantine
  'Enigmatic': [0, 1, 4, 6, 8, 10, 11],
  'Neapolitan Major': [0, 1, 3, 5, 7, 9, 11],
  'Neapolitan Minor': [0, 1, 3, 5, 7, 8, 11],
  'Persian': [0, 1, 4, 5, 6, 8, 11],
  'Arabian': [0, 2, 4, 5, 6, 8, 10],
  'Japanese': [0, 1, 5, 7, 8], // Hirajoshi scale
  'Egyptian': [0, 2, 5, 7, 10], // Similar to suspended pentatonic
  'Indian': [0, 1, 4, 5, 7, 8, 10], // Phrygian dominant
  'Gypsy': [0, 2, 3, 6, 7, 8, 10], // Hungarian Gypsy
  'Spanish': [0, 1, 4, 5, 7, 8, 10], // Phrygian dominant (same as Indian)
  'Jewish': [0, 1, 4, 5, 7, 8, 10], // Freygish (same as Phrygian dominant)
  'Chinese': [0, 2, 4, 7, 9] // Major pentatonic
};

// All scales combined
export const allScales = {
  ...majorModes,
  ...pentatonicScales,
  ...otherScales,
  ...worldScales,
};

// Generate a scale from intervals and root note
export const generateScale = (rootNote, intervals) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = notes.indexOf(rootNote.slice(0, -1));
  const octave = parseInt(rootNote.slice(-1));

  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const octaveShift = Math.floor((rootIndex + interval) / 12);
    return `${notes[noteIndex]}${octave + octaveShift}`;
  });
};

// Generate all scales for a given root note
export const generateScalesForRoot = rootNote => {
  const result = {};

  // Generate major modes
  Object.entries(majorModes).forEach(([name, intervals]) => {
    result[`${rootNote.slice(0, -1)} ${name}`] = generateScale(rootNote, intervals);
  });

  // Generate pentatonic scales
  Object.entries(pentatonicScales).forEach(([name, intervals]) => {
    result[`${rootNote.slice(0, -1)} ${name}`] = generateScale(rootNote, intervals);
  });

  // Generate other scales
  Object.entries(otherScales).forEach(([name, intervals]) => {
    result[`${rootNote.slice(0, -1)} ${name}`] = generateScale(rootNote, intervals);
  });

  // Generate world scales
  Object.entries(worldScales).forEach(([name, intervals]) => {
    result[`${rootNote.slice(0, -1)} ${name}`] = generateScale(rootNote, intervals);
  });

  return result;
};

// Generate all scales for common root notes
export const generateAllScales = () => {
  const rootNotes = ['C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G3', 'Ab3', 'A3', 'Bb3', 'B3'];
  let allScales = {};

  rootNotes.forEach(rootNote => {
    allScales = { ...allScales, ...generateScalesForRoot(rootNote) };
  });

  return allScales;
};

// Default scales for the application
export const defaultScales = {
  // Major scales
  'C Major': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  'C# Major': ['C#4', 'D#4', 'F4', 'F#4', 'G#4', 'A#4', 'C5', 'C#5'],
  'D Major': ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'],
  'Eb Major': ['Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5', 'Eb5'],
  'E Major': ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5', 'E5'],
  'F Major': ['F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4'],
  'F# Major': ['F#3', 'G#3', 'A#3', 'B3', 'C#4', 'D#4', 'F4', 'F#4'],
  'G Major': ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4'],
  'Ab Major': ['Ab3', 'Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4'],
  'A Major': ['A3', 'B3', 'C#4', 'D4', 'E4', 'F#4', 'G#4', 'A4'],
  'Bb Major': ['Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4'],
  'B Major': ['B3', 'C#4', 'D#4', 'E4', 'F#4', 'G#4', 'A#4', 'B4'],

  // Natural minor scales
  'C Minor': ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
  'C# Minor': ['C#4', 'D#4', 'E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5'],
  'D Minor': ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5'],
  'Eb Minor': ['Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'Cb5', 'Db5', 'Eb5'],
  'E Minor': ['E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
  'F Minor': ['F3', 'G3', 'Ab3', 'Bb3', 'C4', 'Db4', 'Eb4', 'F4'],
  'F# Minor': ['F#3', 'G#3', 'A3', 'B3', 'C#4', 'D4', 'E4', 'F#4'],
  'G Minor': ['G3', 'A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4'],
  'G# Minor': ['G#3', 'A#3', 'B3', 'C#4', 'D#4', 'E4', 'F#4', 'G#4'],
  'A Minor': ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
  'Bb Minor': ['Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4'],
  'B Minor': ['B3', 'C#4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4'],

  // Modes
  'C Dorian': ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5'],
  'C Phrygian': ['C4', 'Db4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
  'C Lydian': ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5'],
  'C Mixolydian': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5'],
  'C Locrian': ['C4', 'Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'C5'],
  'G Dorian': ['G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4'],
  'D Mixolydian': ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'D5'],
  'A Phrygian': ['A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
  'E Lydian': ['E4', 'F#4', 'G#4', 'A#4', 'B4', 'C#5', 'D#5', 'E5'],

  // Pentatonic scales
  'C Major Pentatonic': ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
  'C Minor Pentatonic': ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'],
  'G Major Pentatonic': ['G3', 'A3', 'B3', 'D4', 'E4', 'G4'],
  'G Minor Pentatonic': ['G3', 'Bb3', 'C4', 'D4', 'F4', 'G4'],
  'D Major Pentatonic': ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5'],
  'A Minor Pentatonic': ['A3', 'C4', 'D4', 'E4', 'G4', 'A4'],
  'E Minor Pentatonic': ['E4', 'G4', 'A4', 'B4', 'D5', 'E5'],

  // Blues scales
  'C Blues': ['C4', 'Eb4', 'F4', 'F#4', 'G4', 'Bb4', 'C5'],
  'G Blues': ['G3', 'Bb3', 'C4', 'C#4', 'D4', 'F4', 'G4'],
  'D Blues': ['D4', 'F4', 'G4', 'G#4', 'A4', 'C5', 'D5'],
  'A Blues': ['A3', 'C4', 'D4', 'D#4', 'E4', 'G4', 'A4'],
  'E Blues': ['E4', 'G4', 'A4', 'A#4', 'B4', 'D5', 'E5'],

  // Harmonic and melodic minor
  'C Harmonic Minor': ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'B4', 'C5'],
  'C Melodic Minor': ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  'G Harmonic Minor': ['G3', 'A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F#4', 'G4'],
  'A Melodic Minor': ['A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G#4', 'A4'],

  // World and exotic scales
  'C Hungarian Minor': ['C4', 'D4', 'Eb4', 'F#4', 'G4', 'Ab4', 'B4', 'C5'],
  'C Double Harmonic': ['C4', 'Db4', 'E4', 'F4', 'G4', 'Ab4', 'B4', 'C5'],
  'D Persian': ['D4', 'Eb4', 'F#4', 'G4', 'Ab4', 'Bb4', 'C#5', 'D5'],
  'E Japanese': ['E4', 'F4', 'A4', 'B4', 'C5', 'E5'],
  'G Egyptian': ['G3', 'A3', 'C4', 'D4', 'F4', 'G4'],
  'A Spanish': ['A3', 'Bb3', 'C#4', 'D4', 'E4', 'F4', 'G4', 'A4'],
  'C Whole Tone': ['C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5'],
  'C Enigmatic': ['C4', 'Db4', 'E4', 'F#4', 'G#4', 'A#4', 'B4', 'C5'],
  'C Diminished': ['C4', 'D4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'A4', 'B4', 'C5'],
  'C Chromatic': [
    'C4',
    'C#4',
    'D4',
    'D#4',
    'E4',
    'F4',
    'F#4',
    'G4',
    'G#4',
    'A4',
    'A#4',
    'B4',
    'C5',
  ],
};
