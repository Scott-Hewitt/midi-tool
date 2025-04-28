// Advanced scales and modes for melody and chord generation

// Major modes
export const majorModes = {
  'Ionian (Major)': [0, 2, 4, 5, 7, 9, 11], // Major scale
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Aeolian (Minor)': [0, 2, 3, 5, 7, 8, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10]
};

// Pentatonic scales
export const pentatonicScales = {
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10]
};

// Other scales
export const otherScales = {
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Whole Tone': [0, 2, 4, 6, 8, 10],
  'Diminished': [0, 2, 3, 5, 6, 8, 9, 11],
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

// All scales combined
export const allScales = {
  ...majorModes,
  ...pentatonicScales,
  ...otherScales
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
export const generateScalesForRoot = (rootNote) => {
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
  
  return result;
};

// Generate all scales for common root notes
export const generateAllScales = () => {
  const rootNotes = ['C4', 'D4', 'E4', 'F4', 'G3', 'A3', 'B3'];
  let allScales = {};
  
  rootNotes.forEach(rootNote => {
    allScales = { ...allScales, ...generateScalesForRoot(rootNote) };
  });
  
  return allScales;
};

// Default scales for the application
export const defaultScales = {
  'C Major': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  'C Minor': ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
  'G Major': ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4'],
  'F Major': ['F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4'],
  'A Minor': ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
  'C Dorian': ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5'],
  'C Lydian': ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5'],
  'C Mixolydian': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5'],
  'C Major Pentatonic': ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
  'C Minor Pentatonic': ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'],
  'C Blues': ['C4', 'Eb4', 'F4', 'F#4', 'G4', 'Bb4', 'C5']
};