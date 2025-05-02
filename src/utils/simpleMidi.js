export const noteToMidiNumber = noteName => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const note = noteName.slice(0, -1);
  const octave = parseInt(noteName.slice(-1));
  return notes.indexOf(note) + (octave + 1) * 12;
};

export const createMIDIFile = (melodyData, chordData, options = {}) => {
  const {
    includeMelody = true,
    includeChords = true,
    includeBass = true,
    melodyChannel = 0,
    chordChannel = 1,
    bassChannel = 2,
    melodyInstrument = 0, // Piano
    chordInstrument = 4, // Electric Piano
    bassInstrument = 32, // Acoustic Bass
    // These options are reserved for future implementation
    // applyExpression = true,
    // humanize = true,
  } = options;

  const header = [
    0x4d,
    0x54,
    0x68,
    0x64, // MThd
    0x00,
    0x00,
    0x00,
    0x06, // Header size
    0x00,
    0x01, // Format type
    0x00,
    includeMelody + includeChords + includeBass + 1, // Number of tracks
    0x00,
    0x60, // Division
  ];

  const tracks = [];
  const controlTrack = [];

  controlTrack.push(
    0x4d,
    0x54,
    0x72,
    0x6b, // MTrk
    0x00,
    0x00,
    0x00,
    0x00 // Placeholder for track length
  );

  const trackNameBytes = Array.from('Control Track').map(c => c.charCodeAt(0));
  controlTrack.push(0x00, 0xff, 0x03, trackNameBytes.length, ...trackNameBytes);

  const tempo = melodyData?.tempo || chordData?.tempo || 120;
  const mspqn = Math.floor(60000000 / tempo);
  controlTrack.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (mspqn >> 16) & 0xff,
    (mspqn >> 8) & 0xff,
    mspqn & 0xff
  );

  controlTrack.push(0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  controlTrack.push(0x00, 0xff, 0x2f, 0x00);

  const controlTrackLength = controlTrack.length - 8;
  controlTrack[4] = (controlTrackLength >> 24) & 0xff;
  controlTrack[5] = (controlTrackLength >> 16) & 0xff;
  controlTrack[6] = (controlTrackLength >> 8) & 0xff;
  controlTrack[7] = controlTrackLength & 0xff;

  tracks.push(new Uint8Array(controlTrack));

  // Melody track
  if (includeMelody && melodyData && melodyData.notes && melodyData.notes.length > 0) {
    const melodyTrack = [];

    // Track header
    melodyTrack.push(
      0x4d,
      0x54,
      0x72,
      0x6b, // MTrk
      0x00,
      0x00,
      0x00,
      0x00 // Placeholder for track length
    );

    // Track name
    const melodyNameBytes = Array.from('Melody').map(c => c.charCodeAt(0));
    melodyTrack.push(
      0x00, // Delta time
      0xff,
      0x03,
      melodyNameBytes.length,
      ...melodyNameBytes // Track name meta event
    );

    // Program change (instrument)
    melodyTrack.push(
      0x00, // Delta time
      0xc0 | melodyChannel,
      melodyInstrument // Program change
    );

    // Sort notes by start time
    const sortedNotes = [...melodyData.notes].sort((a, b) => a.startTime - b.startTime);

    // Add notes
    let currentTime = 0;
    for (const note of sortedNotes) {
      const pitch = noteToMidiNumber(note.pitch);
      const velocity = Math.floor(note.velocity * 127);
      const startTime = Math.floor(note.startTime * 96); // 96 ticks per quarter note
      const duration = Math.floor(note.duration * 96);

      // Note on
      const deltaTimeOn = startTime - currentTime;
      melodyTrack.push(...writeVariableLength(deltaTimeOn));
      melodyTrack.push(0x90 | melodyChannel, pitch, velocity);

      // Note off
      melodyTrack.push(...writeVariableLength(duration));
      melodyTrack.push(0x80 | melodyChannel, pitch, 0);

      currentTime = startTime + duration;
    }

    // End of track
    melodyTrack.push(
      0x00, // Delta time
      0xff,
      0x2f,
      0x00 // End of track meta event
    );

    // Update track length
    const melodyTrackLength = melodyTrack.length - 8; // Subtract header size
    melodyTrack[4] = (melodyTrackLength >> 24) & 0xff;
    melodyTrack[5] = (melodyTrackLength >> 16) & 0xff;
    melodyTrack[6] = (melodyTrackLength >> 8) & 0xff;
    melodyTrack[7] = melodyTrackLength & 0xff;

    tracks.push(new Uint8Array(melodyTrack));
  }

  // Chord track
  if (includeChords && chordData && chordData.progression && chordData.progression.length > 0) {
    const chordTrack = [];

    // Track header
    chordTrack.push(
      0x4d,
      0x54,
      0x72,
      0x6b, // MTrk
      0x00,
      0x00,
      0x00,
      0x00 // Placeholder for track length
    );

    // Track name
    const chordNameBytes = Array.from('Chords').map(c => c.charCodeAt(0));
    chordTrack.push(
      0x00, // Delta time
      0xff,
      0x03,
      chordNameBytes.length,
      ...chordNameBytes // Track name meta event
    );

    // Program change (instrument)
    chordTrack.push(
      0x00, // Delta time
      0xc0 | chordChannel,
      chordInstrument // Program change
    );

    // Sort chords by position
    const sortedChords = [...chordData.progression].sort((a, b) => a.position - b.position);

    // Add chords
    let currentTime = 0;
    for (const chord of sortedChords) {
      const startTime = Math.floor(chord.position * 4 * 96); // 4 beats per bar, 96 ticks per quarter
      const duration = Math.floor(chord.duration * 4 * 96);

      // Add each note in the chord
      for (const noteName of chord.notes) {
        const pitch = noteToMidiNumber(noteName);
        const velocity = 80;

        // Note on
        const deltaTimeOn = startTime - currentTime;
        if (deltaTimeOn > 0) {
          chordTrack.push(...writeVariableLength(deltaTimeOn));
          currentTime = startTime;
        } else {
          chordTrack.push(0x00); // Delta time 0 for simultaneous notes
        }
        chordTrack.push(0x90 | chordChannel, pitch, velocity);
      }

      // Note off for each note
      for (const noteName of chord.notes) {
        const pitch = noteToMidiNumber(noteName);

        // Note off
        chordTrack.push(...writeVariableLength(duration));
        chordTrack.push(0x80 | chordChannel, pitch, 0);
      }

      currentTime = startTime + duration;
    }

    // End of track
    chordTrack.push(
      0x00, // Delta time
      0xff,
      0x2f,
      0x00 // End of track meta event
    );

    // Update track length
    const chordTrackLength = chordTrack.length - 8; // Subtract header size
    chordTrack[4] = (chordTrackLength >> 24) & 0xff;
    chordTrack[5] = (chordTrackLength >> 16) & 0xff;
    chordTrack[6] = (chordTrackLength >> 8) & 0xff;
    chordTrack[7] = chordTrackLength & 0xff;

    tracks.push(new Uint8Array(chordTrack));
  }

  // Bass track
  if (includeBass && chordData && chordData.progression && chordData.progression.length > 0) {
    const bassTrack = [];

    // Track header
    bassTrack.push(
      0x4d,
      0x54,
      0x72,
      0x6b, // MTrk
      0x00,
      0x00,
      0x00,
      0x00 // Placeholder for track length
    );

    // Track name
    const bassNameBytes = Array.from('Bass').map(c => c.charCodeAt(0));
    bassTrack.push(
      0x00, // Delta time
      0xff,
      0x03,
      bassNameBytes.length,
      ...bassNameBytes // Track name meta event
    );

    // Program change (instrument)
    bassTrack.push(
      0x00, // Delta time
      0xc0 | bassChannel,
      bassInstrument // Program change
    );

    // Sort chords by position
    const sortedChords = [...chordData.progression].sort((a, b) => a.position - b.position);

    // Add bass notes (root of each chord)
    let currentTime = 0;
    for (const chord of sortedChords) {
      const startTime = Math.floor(chord.position * 4 * 96);
      const duration = Math.floor(chord.duration * 4 * 96);
      const rootNote = chord.root + '2'; // One octave lower
      const pitch = noteToMidiNumber(rootNote);
      const velocity = 100;

      // Note on
      const deltaTimeOn = startTime - currentTime;
      bassTrack.push(...writeVariableLength(deltaTimeOn));
      bassTrack.push(0x90 | bassChannel, pitch, velocity);

      // Note off
      bassTrack.push(...writeVariableLength(duration));
      bassTrack.push(0x80 | bassChannel, pitch, 0);

      currentTime = startTime + duration;
    }

    // End of track
    bassTrack.push(
      0x00, // Delta time
      0xff,
      0x2f,
      0x00 // End of track meta event
    );

    // Update track length
    const bassTrackLength = bassTrack.length - 8; // Subtract header size
    bassTrack[4] = (bassTrackLength >> 24) & 0xff;
    bassTrack[5] = (bassTrackLength >> 16) & 0xff;
    bassTrack[6] = (bassTrackLength >> 8) & 0xff;
    bassTrack[7] = bassTrackLength & 0xff;

    tracks.push(new Uint8Array(bassTrack));
  }

  // Combine header and tracks
  const headerArray = new Uint8Array(header);
  const tracksArray = tracks.reduce((acc, track) => {
    const newArray = new Uint8Array(acc.length + track.length);
    newArray.set(acc);
    newArray.set(track, acc.length);
    return newArray;
  }, new Uint8Array(0));

  const midiFile = new Uint8Array(headerArray.length + tracksArray.length);
  midiFile.set(headerArray);
  midiFile.set(tracksArray, headerArray.length);

  return midiFile;
};

function writeVariableLength(value) {
  if (value < 0) return [0];

  const bytes = [];
  let v = value;

  while (v > 0) {
    bytes.unshift(v & 0x7f);
    v >>= 7;
  }

  for (let i = 0; i < bytes.length - 1; i++) {
    bytes[i] |= 0x80;
  }
  return bytes.length > 0 ? bytes : [0];
}

export const exportAndDownloadMIDI = (melodyData, chordData, fileName, options = {}) => {
  try {
    if (!melodyData && !chordData) {
      console.error('No data to export');
      return false;
    }

    const midiData = createMIDIFile(melodyData, chordData, options);
    const midiBlob = new Blob([midiData], { type: 'audio/midi' });

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(midiBlob);
    downloadLink.download = `${fileName}.mid`;
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    }, 100);

    return true;
  } catch (error) {
    console.error('Error exporting MIDI:', error);
    return false;
  }
};
