// Rhythm patterns and arpeggios for melody generation

// Rhythmic patterns (in beats)
export const rhythmPatterns = {
  basic: [1, 1, 1, 1], // Quarter notes
  syncopated: [0.5, 0.5, 1, 0.5, 1.5], // Eighth notes and dotted notes
  triplet: [0.33, 0.33, 0.33, 1, 1, 1], // Triplets and quarter notes
  complex: [0.25, 0.25, 0.5, 0.75, 0.25, 1, 1], // 16ths, 8ths, dotted 8ths
  waltz: [1, 0.5, 0.5, 1, 1], // Waltz pattern
  swing: [0.67, 0.33, 0.67, 0.33], // Swing rhythm
  dotted: [1.5, 0.5, 1.5, 0.5], // Dotted rhythm
  march: [0.75, 0.25, 0.5, 0.5, 1, 1], // March rhythm
};

// Melodic contour types
export const contourTypes = {
  ascending: (i, total) => i / total, // Gradually rise
  descending: (i, total) => 1 - i / total, // Gradually fall
  arch: (i, total) => 1 - Math.abs(i / total - 0.5) * 2, // Rise then fall
  valley: (i, total) => Math.abs(i / total - 0.5) * 2, // Fall then rise
  random: () => Math.random(), // Random movement
  static: () => 0.5, // Stay in the middle
  wave: (i, total) => Math.sin((i / total) * Math.PI * 2) * 0.5 + 0.5, // Sinusoidal wave
};

// Arpeggio patterns
export const arpeggioPatterns = {
  up: chord => [...chord],
  down: chord => [...chord].reverse(),
  upDown: chord => [...chord, ...[...chord].slice(1, -1).reverse()],
  downUp: chord => [...chord].reverse().concat([...chord].slice(1, -1)),
  random: chord => {
    const result = [];
    const available = [...chord];
    while (available.length > 0) {
      const index = Math.floor(Math.random() * available.length);
      result.push(available[index]);
      available.splice(index, 1);
    }
    return result;
  },
  insideOut: chord => {
    const result = [];
    const middle = Math.floor(chord.length / 2);
    for (let i = 0; i < chord.length; i++) {
      if (i % 2 === 0) {
        result.push(chord[middle + Math.floor(i / 2)]);
      } else {
        result.push(chord[middle - Math.ceil(i / 2)]);
      }
    }
    return result;
  },
  outsideIn: chord => {
    const result = [];
    for (let i = 0; i < chord.length; i++) {
      if (i % 2 === 0) {
        result.push(chord[i / 2]);
      } else {
        result.push(chord[chord.length - Math.ceil(i / 2)]);
      }
    }
    return result;
  },
};

// Generate a motif (short musical idea)
export const generateMotif = (scale, length = 4) => {
  const motif = [];
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * scale.length);
    motif.push({
      scaleIndex: randomIndex,
      duration: [0.5, 1, 1.5][Math.floor(Math.random() * 3)],
    });
  }
  return motif;
};

// Apply variations to a motif
export const applyMotifVariation = (motif, scaleLength, variationType) => {
  switch (variationType) {
    case 'transpose': {
      // Transpose up by a certain interval
      const interval = 2; // Could be randomized or parameterized
      return motif.map(note => ({
        ...note,
        scaleIndex: (note.scaleIndex + interval) % scaleLength,
      }));
    }

    case 'invert':
      // Invert the motif (mirror the intervals)
      return motif.map(note => ({
        ...note,
        scaleIndex: scaleLength - 1 - note.scaleIndex,
      }));

    case 'retrograde':
      // Play the motif backwards
      return [...motif].reverse();

    case 'augment':
      // Double the duration of each note
      return motif.map(note => ({
        ...note,
        duration: note.duration * 2,
      }));

    case 'diminish':
      // Halve the duration of each note
      return motif.map(note => ({
        ...note,
        duration: note.duration / 2,
      }));

    default:
      return motif;
  }
};

// Generate arpeggios from chord progression
export const generateArpeggios = (chordProgression, pattern, notesPerChord) => {
  const notes = [];
  let currentTime = 0;

  chordProgression.forEach(chord => {
    const chordDuration = chord.duration * 4; // 4 beats per bar
    const noteDuration = chordDuration / notesPerChord;

    const patternFn = arpeggioPatterns[pattern] || arpeggioPatterns.up;
    const arpeggioNotes = patternFn(chord.notes);
    for (let i = 0; i < notesPerChord; i++) {
      const noteIndex = i % arpeggioNotes.length;
      notes.push({
        pitch: arpeggioNotes[noteIndex],
        duration: noteDuration,
        velocity: 0.7 + Math.random() * 0.3,
        startTime: currentTime,
      });
      currentTime += noteDuration;
    }
  });

  return notes;
};
