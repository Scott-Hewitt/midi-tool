import JZZ from 'jzz';

let isJzzInitialized = false;
async function initializeJZZ() {
  if (isJzzInitialized) return true;

  try {
    JZZ();
    await import('jzz-midi-smf');
    await import('jzz-synth-tiny');
    await new Promise(resolve => setTimeout(resolve, 100));

    if (typeof JZZ.MIDI === 'undefined') {
      JZZ.MIDI = {};
    }

    if (JZZ.synth && typeof JZZ.synth.Tiny === 'object') {
      JZZ.synth.Tiny.register();
    }
    isJzzInitialized = true;
    return true;
  } catch (e) {
    console.error('Error initializing JZZ:', e);
    return false;
  }
}

// Call the initialization function immediately to start loading
initializeJZZ().catch(err => console.error('Failed to initialize JZZ:', err));

/**
 * Initialize JZZ
 * @returns {Promise<Object>} - JZZ instance
 */
export const initJZZ = async () => {
  // Make sure JZZ is initialized
  await initializeJZZ();

  try {
    const midi = await JZZ({
      sysex: true,
      engine: 'none',
    });
    return midi;
  } catch (err) {
    console.error('Error creating JZZ instance:', err);
    return null;
  }
};

/**
 * Convert note name to MIDI number
 * @param {string} noteName - Note name (e.g., 'C4')
 * @returns {number} - MIDI note number
 */
export const noteToMidiNumber = noteName => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Check if the last character is a digit (octave)
  const lastChar = noteName.slice(-1);
  const hasOctave = /\d/.test(lastChar);

  let note, octave;

  if (hasOctave) {
    // Format: C4, D#5, etc.
    note = noteName.slice(0, -1);
    octave = parseInt(lastChar);
  } else {
    // Format: C, D#, etc. (default to octave 4)
    note = noteName;
    octave = 4;
    console.warn('Note without octave:', noteName, '- defaulting to octave 4');
  }

  const noteIndex = notes.indexOf(note);
  if (noteIndex === -1) {
    console.error('Invalid note name:', noteName, '- note part:', note);
    return 60; // Default to middle C (C4) if invalid
  }

  if (isNaN(octave)) {
    console.error('Invalid octave in note name:', noteName, '- octave part:', lastChar);
    octave = 4; // Default to octave 4 if invalid
  }

  // MIDI note number calculation: noteIndex + (octave+1) * 12
  const midiNumber = noteIndex + (octave + 1) * 12;

  // Validate the result is in MIDI range (0-127)
  if (midiNumber < 0 || midiNumber > 127) {
    console.error('MIDI note number out of range:', midiNumber, 'for note:', noteName);
    return Math.max(0, Math.min(127, midiNumber)); // Clamp to valid MIDI range
  }

  return midiNumber;
};

/**
 * Export MIDI with JZZ (more advanced features)
 * @param {Object} melodyData - Melody data
 * @param {Object} chordData - Chord progression data
 * @param {string} fileName - File name (not used in this function but kept for API compatibility)
 * @param {Object} options - Export options
 * @returns {Promise<Uint8Array>} - MIDI file data
 */
export const exportMIDIWithJZZ = async (melodyData, chordData, fileName, options = {}) => {
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
  } = options;

  const midi = await initJZZ();
  if (!midi) return null;

  try {
    if (
      JZZ.synth &&
      typeof JZZ.synth.Tiny === 'object' &&
      typeof JZZ.synth.Tiny.register === 'function'
    ) {
      JZZ.synth.Tiny.register();
    }
  } catch (e) {
    console.warn('Could not initialize JZZ synth:', e);
  }

  // Ensure MIDI.SMF is available
  if (typeof JZZ.MIDI.SMF !== 'function') {
    console.warn('JZZ.MIDI.SMF not available in exportMIDIWithJZZ, falling back to simpleMidi implementation');

    // Import and use simpleMidi as a fallback
    const { createMIDIFile } = await import('./simpleMidi');
    return createMIDIFile(melodyData, chordData, options);
  }

  try {
    // Create a new SMF object
    const smf = new JZZ.MIDI.SMF(1); // Format 1 (multiple tracks)

    // Create tracks for melody, chords, and bass
    if (includeMelody && melodyData && melodyData.notes && melodyData.notes.length > 0) {
      const melodyTrack = new JZZ.MIDI.SMF.MTrk();
      smf.push(melodyTrack);

      // Add melody notes
      melodyData.notes.forEach((note, index) => {
        const pitch = noteToMidiNumber(note.pitch);
        const velocity = Math.round(note.velocity * 127);
        const startTime = note.startTime;
        const duration = note.duration;

        // Note on
        melodyTrack.add(startTime, JZZ.MIDI.noteOn(melodyChannel, pitch, velocity));
        // Note off
        melodyTrack.add(startTime + duration, JZZ.MIDI.noteOff(melodyChannel, pitch, 0));
      });
    }

    if (includeChords && chordData && chordData.progression && chordData.progression.length > 0) {
      const chordTrack = new JZZ.MIDI.SMF.MTrk();
      smf.push(chordTrack);

      // Add chord notes
      chordData.progression.forEach((chord) => {
        const startTime = chord.position;
        const duration = chord.duration;

        // Add each note in the chord
        if (chord.notes && chord.notes.length > 0) {
          chord.notes.forEach((noteName) => {
            const pitch = noteToMidiNumber(noteName);
            const velocity = 80; // Medium velocity for chords

            // Note on
            chordTrack.add(startTime, JZZ.MIDI.noteOn(chordChannel, pitch, velocity));
            // Note off
            chordTrack.add(startTime + duration, JZZ.MIDI.noteOff(chordChannel, pitch, 0));
          });
        }
      });
    }

    // Return the MIDI data
    return smf.dump();
  } catch (error) {
    console.error('Error creating MIDI file with JZZ:', error);
    return null;
  }
};

/**
 * Export MIDI file with JZZ and download it
 * @param {Object} melodyData - Melody data
 * @param {Object} chordData - Chord progression data
 * @param {string} fileName - File name
 * @param {Object} options - Export options
 * @returns {Promise<boolean>} - Whether the export was successful
 */
export const exportAndDownloadMIDI = async (melodyData, chordData, fileName, options = {}) => {
  try {
    // Log detailed information about the input data
    console.log('Exporting MIDI with data:', {
      melodyData: melodyData
        ? {
            notes: melodyData.notes ? melodyData.notes.length : 0,
            tempo: melodyData.tempo,
          }
        : null,
      chordData: chordData
        ? {
            progression: chordData.progression ? chordData.progression.length : 0,
            tempo: chordData.tempo,
          }
        : null,
      fileName: fileName,
      options: options,
    });

    // Validate input data
    if (!melodyData && !chordData) {
      console.error('No data to export');
      return false;
    }

    if (melodyData && (!melodyData.notes || !Array.isArray(melodyData.notes))) {
      console.error(
        'Invalid melody data structure - missing or invalid notes array:',
        melodyData
      );
    }

    if (chordData && (!chordData.progression || !Array.isArray(chordData.progression))) {
      console.error(
        'Invalid chord data structure - missing or invalid progression array:',
        chordData
      );
    }

    // Check if JZZ.MIDI.SMF is available
    if (typeof JZZ.MIDI.SMF !== 'function') {
      console.warn('JZZ.MIDI.SMF not available, falling back to simpleMidi implementation');

      // Import and use simpleMidi as a fallback
      const simpleMidi = await import('./simpleMidi');
      return simpleMidi.exportAndDownloadMIDI(melodyData, chordData, fileName, options);
    }

    // Generate MIDI data using JZZ
    const midiData = await exportMIDIWithJZZ(melodyData, chordData, fileName, options);

    if (!midiData) {
      console.error('Failed to generate MIDI data with JZZ, falling back to simpleMidi');

      // Try with simpleMidi as a fallback
      const simpleMidi = await import('./simpleMidi');
      return simpleMidi.exportAndDownloadMIDI(melodyData, chordData, fileName, options);
    }

    console.log('Generated MIDI data size:', midiData.length, 'bytes');
    if (midiData.length < 20) {
      console.warn('MIDI data is suspiciously small, might be empty or invalid');
    }

    // Verify that the MIDI data is not empty
    if (!midiData || midiData.length < 14) {
      // Minimum size for a valid MIDI file header
      console.error('Generated MIDI data is empty or too small to be valid');
      return false;
    }

    // Verify MIDI header
    if (
      midiData[0] !== 0x4d ||
      midiData[1] !== 0x54 ||
      midiData[2] !== 0x68 ||
      midiData[3] !== 0x64
    ) {
      console.error('Invalid MIDI header - missing MThd signature');
      return false;
    }

    try {
      // Create a Blob from the MIDI data
      const midiBlob = new Blob([midiData], { type: 'audio/midi' });
      console.log('Created MIDI Blob of size:', midiBlob.size, 'bytes');

      // Create and trigger download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(midiBlob);
      downloadLink.download = `${fileName}.mid`;
      downloadLink.style.display = 'none';

      document.body.appendChild(downloadLink);
      console.log('Triggering download for file:', `${fileName}.mid`);
      downloadLink.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
        console.log('Download link cleaned up');
      }, 100);

      return true;
    } catch (downloadError) {
      console.error('Error during download process:', downloadError);
      return false;
    }
  } catch (error) {
    console.error('Error exporting MIDI:', error);
    return false;
  }
};
