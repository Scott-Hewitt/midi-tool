// JZZ.js integration for advanced MIDI features

import JZZ from 'jzz';
import 'jzz-midi-smf'; // For Standard MIDI File support

/**
 * Custom error class for MIDI-related errors
 */
export class MIDIError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'MIDIError';
    this.originalError = originalError;
  }
}

/**
 * Check if MIDI is supported in the current browser
 * @returns {boolean} - Whether MIDI is supported
 */
export const isMIDISupported = () => {
  return typeof window !== 'undefined' && typeof JZZ === 'function';
};

/**
 * Initialize JZZ
 * @returns {Promise<Object>} - JZZ instance
 * @throws {MIDIError} - If JZZ initialization fails
 */
export const initJZZ = async () => {
  if (!isMIDISupported()) {
    throw new MIDIError('MIDI is not supported in this environment');
  }

  try {
    const midi = await JZZ();

    if (!midi) {
      throw new MIDIError('JZZ initialization returned null or undefined');
    }

    return midi;
  } catch (err) {
    console.error('Error initializing JZZ:', err);
    throw new MIDIError('Failed to initialize MIDI system', err);
  }
};

/**
 * Convert note name to MIDI number
 * @param {string} noteName - Note name (e.g., 'C4')
 * @returns {number} - MIDI note number
 * @throws {MIDIError} - If note name is invalid
 */
export const noteToMidiNumber = (noteName) => {
  if (!noteName || typeof noteName !== 'string') {
    throw new MIDIError(`Invalid note name: ${noteName}`);
  }

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Check if the note name has the correct format (note + octave)
  if (noteName.length < 2) {
    throw new MIDIError(`Invalid note name format: ${noteName}`);
  }

  const note = noteName.slice(0, -1);
  const octaveStr = noteName.slice(-1);

  // Check if the note is valid
  const noteIndex = notes.indexOf(note);
  if (noteIndex === -1) {
    throw new MIDIError(`Unknown note: ${note}`);
  }

  // Check if the octave is a valid number
  const octave = parseInt(octaveStr);
  if (isNaN(octave)) {
    throw new MIDIError(`Invalid octave: ${octaveStr}`);
  }

  // Calculate and return MIDI number
  return noteIndex + (octave + 1) * 12;
};

/**
 * Export MIDI with JZZ (more advanced features)
 * @param {Object} melodyData - Melody data
 * @param {Object} chordData - Chord progression data
 * @param {Object} options - Export options
 * @returns {Promise<Uint8Array>} - MIDI file data
 * @throws {MIDIError} - If MIDI export fails
 */
export const exportMIDIWithJZZ = async (melodyData, chordData, options = {}) => {
  // Validate that at least one of melody or chord data is provided
  if (!melodyData && !chordData) {
    throw new MIDIError('No melody or chord data provided for MIDI export');
  }

  // Extract and validate options
  const {
    includeMelody = true,
    includeChords = true,
    includeBass = true,
    melodyChannel = 0,
    chordChannel = 1,
    bassChannel = 2,
    melodyInstrument = 0, // Piano
    chordInstrument = 4,  // Electric Piano
    bassInstrument = 32,  // Acoustic Bass
    applyExpression = true,
    humanize = true
  } = options;

  try {
    // Initialize JZZ
    const midi = await initJZZ();

    // Create a new MIDI file
    const smf = new JZZ.MIDI.SMF(1); // Type 1 MIDI file (multiple tracks)

    // Create tracks
    const controlTrack = new JZZ.MIDI.SMF.MTrk();
    const melodyTrack = includeMelody && melodyData ? new JZZ.MIDI.SMF.MTrk() : null;
    const chordTrack = includeChords && chordData ? new JZZ.MIDI.SMF.MTrk() : null;
    const bassTrack = includeBass && chordData ? new JZZ.MIDI.SMF.MTrk() : null;

    // Add metadata
    controlTrack.add(0, JZZ.MIDI.smfSeqName('MIDI Melody & Chord Generator'));
    if (melodyTrack) melodyTrack.add(0, JZZ.MIDI.smfTrackName('Melody'));
    if (chordTrack) chordTrack.add(0, JZZ.MIDI.smfTrackName('Chords'));
    if (bassTrack) bassTrack.add(0, JZZ.MIDI.smfTrackName('Bass'));

    // Set tempo (microseconds per quarter note)
    const tempo = melodyData?.tempo || chordData?.tempo || 120;
    controlTrack.add(0, JZZ.MIDI.smfBPM(tempo));

    // Set time signature (4/4)
    controlTrack.add(0, JZZ.MIDI.smfTimeSignature(4, 4));

    // Add melody track
    if (melodyTrack && melodyData && Array.isArray(melodyData.notes) && melodyData.notes.length > 0) {
      try {
        // Set instrument
        melodyTrack.add(0, JZZ.MIDI.programChange(melodyChannel, melodyInstrument));

        // Add notes
        for (const note of melodyData.notes) {
          try {
            if (!note || !note.pitch) {
              console.warn('Skipping invalid note in MIDI export:', note);
              continue;
            }

            const pitch = noteToMidiNumber(note.pitch);
            const velocity = Math.min(127, Math.max(1, Math.floor((note.velocity || 0.8) * 127)));
            const duration = Math.max(1, (note.duration || 1) * 480); // 480 ticks per quarter note
            const startTime = Math.max(0, (note.startTime || 0) * 480);

            melodyTrack.add(startTime, JZZ.MIDI.noteOn(melodyChannel, pitch, velocity));
            melodyTrack.add(startTime + duration, JZZ.MIDI.noteOff(melodyChannel, pitch));
          } catch (noteError) {
            console.error('Error adding note to MIDI file:', noteError);
            // Continue with other notes
          }
        }

        // Add expression if enabled
        if (applyExpression) {
          // Add volume controller
          melodyTrack.add(0, JZZ.MIDI.control(melodyChannel, 7, 100)); // Initial volume

          // Add expression controller
          melodyTrack.add(0, JZZ.MIDI.control(melodyChannel, 11, 127)); // Initial expression

          // Add some expression changes
          const totalDuration = melodyData.notes.reduce(
            (max, note) => Math.max(max, (note.startTime || 0) + (note.duration || 1)), 
            0
          ) * 480;

          // Crescendo
          for (let i = 0; i < 5; i++) {
            const time = totalDuration * i / 4;
            const value = 80 + Math.floor(i * 10);
            melodyTrack.add(time, JZZ.MIDI.control(melodyChannel, 11, value));
          }
        }
      } catch (melodyError) {
        console.error('Error creating melody track:', melodyError);
        // Continue with other tracks
      }
    }

    // Add chord track
    if (chordTrack && chordData && Array.isArray(chordData.progression) && chordData.progression.length > 0) {
      try {
        // Set instrument
        chordTrack.add(0, JZZ.MIDI.programChange(chordChannel, chordInstrument));

        // Add chords
        for (const chord of chordData.progression) {
          try {
            if (!chord || !Array.isArray(chord.notes) || chord.notes.length === 0) {
              console.warn('Skipping invalid chord in MIDI export:', chord);
              continue;
            }

            const startTime = Math.max(0, (chord.position || 0) * 4 * 480); // 4 beats per bar, 480 ticks per quarter
            const duration = Math.max(1, (chord.duration || 1) * 4 * 480);

            // Add each note in the chord
            for (const noteName of chord.notes) {
              try {
                if (!noteName) {
                  console.warn('Skipping invalid note in chord for MIDI export');
                  continue;
                }

                const pitch = noteToMidiNumber(noteName);
                const velocity = 80;

                chordTrack.add(startTime, JZZ.MIDI.noteOn(chordChannel, pitch, velocity));
                chordTrack.add(startTime + duration, JZZ.MIDI.noteOff(chordChannel, pitch));
              } catch (chordNoteError) {
                console.error('Error adding chord note to MIDI file:', chordNoteError);
                // Continue with other notes in the chord
              }
            }
          } catch (chordError) {
            console.error('Error adding chord to MIDI file:', chordError);
            // Continue with other chords
          }
        }
      } catch (chordTrackError) {
        console.error('Error creating chord track:', chordTrackError);
        // Continue with other tracks
      }
    }

    // Add bass track
    if (bassTrack && chordData && Array.isArray(chordData.progression) && chordData.progression.length > 0) {
      try {
        // Set instrument
        bassTrack.add(0, JZZ.MIDI.programChange(bassChannel, bassInstrument));

        // Add bass notes (root of each chord)
        for (const chord of chordData.progression) {
          try {
            if (!chord || !chord.root) {
              console.warn('Skipping invalid chord for bass in MIDI export:', chord);
              continue;
            }

            const startTime = Math.max(0, (chord.position || 0) * 4 * 480);
            const duration = Math.max(1, (chord.duration || 1) * 4 * 480);
            const rootNote = chord.root;

            try {
              const pitch = noteToMidiNumber(rootNote) - 12; // One octave lower
              const velocity = 100;

              bassTrack.add(startTime, JZZ.MIDI.noteOn(bassChannel, pitch, velocity));
              bassTrack.add(startTime + duration, JZZ.MIDI.noteOff(bassChannel, pitch));
            } catch (bassNoteError) {
              console.error('Error adding bass note to MIDI file:', bassNoteError);
              // Continue with other bass notes
            }
          } catch (bassChordError) {
            console.error('Error processing chord for bass in MIDI file:', bassChordError);
            // Continue with other chords
          }
        }
      } catch (bassTrackError) {
        console.error('Error creating bass track:', bassTrackError);
        // Continue with other tracks
      }
    }

    // Add tracks to SMF
    smf.push(controlTrack);
    if (melodyTrack) smf.push(melodyTrack);
    if (chordTrack) smf.push(chordTrack);
    if (bassTrack) smf.push(bassTrack);

    // Generate MIDI data
    const midiData = smf.dump();

    if (!midiData) {
      throw new MIDIError('Failed to generate MIDI data');
    }

    return midiData;
  } catch (error) {
    console.error('Error in MIDI export:', error);
    throw new MIDIError('Failed to export MIDI file', error);
  }
};

/**
 * Check if the browser supports file downloads
 * @returns {boolean} - Whether file downloads are supported
 */
export const isFileDownloadSupported = () => {
  return typeof document !== 'undefined' && 
         typeof Blob !== 'undefined' && 
         typeof URL !== 'undefined' && 
         typeof URL.createObjectURL === 'function';
};

/**
 * Export MIDI file with JZZ and download it
 * @param {Object} melodyData - Melody data
 * @param {Object} chordData - Chord progression data
 * @param {string} fileName - File name
 * @param {Object} options - Export options
 * @returns {Promise<boolean>} - Whether the export was successful
 * @throws {MIDIError} - If MIDI export fails and throwErrors is true
 */
export const exportAndDownloadMIDI = async (
  melodyData, 
  chordData, 
  fileName = 'midi-export', 
  options = {}
) => {
  // Validate parameters
  if (!melodyData && !chordData) {
    console.error('No melody or chord data provided for MIDI export');
    return false;
  }

  if (!fileName || typeof fileName !== 'string') {
    console.warn('Invalid file name, using default');
    fileName = 'midi-export';
  }

  // Remove any file extension from the fileName (we'll add .mid)
  fileName = fileName.replace(/\.[^/.]+$/, '');

  // Check if file downloads are supported
  if (!isFileDownloadSupported()) {
    console.error('File downloads are not supported in this environment');
    return false;
  }

  try {
    // Generate MIDI data
    const midiData = await exportMIDIWithJZZ(melodyData, chordData, options);

    if (!midiData || !(midiData instanceof Uint8Array) || midiData.length === 0) {
      throw new MIDIError('Failed to generate valid MIDI data');
    }

    // Create a Blob from the MIDI data
    const midiBlob = new Blob([midiData], { type: 'audio/midi' });

    // Create a download link
    const downloadLink = document.createElement('a');
    const objectUrl = URL.createObjectURL(midiBlob);

    try {
      downloadLink.href = objectUrl;
      downloadLink.download = `${fileName}.mid`;

      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(objectUrl); // Free up memory
      }, 100);

      return true;
    } catch (downloadError) {
      console.error('Error triggering download:', downloadError);

      // Clean up in case of error
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      throw new MIDIError('Failed to trigger file download', downloadError);
    }
  } catch (error) {
    console.error('Error exporting MIDI:', error);

    // If it's already a MIDIError, rethrow it, otherwise wrap it
    if (error instanceof MIDIError) {
      throw error;
    } else {
      throw new MIDIError('Failed to export MIDI file', error);
    }
  }
};
