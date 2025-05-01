// JZZ.js integration for advanced MIDI features

import JZZ from 'jzz';

// Import the SMF module
import 'jzz-midi-smf';
// Import synth module for playback
import 'jzz-synth-tiny';

// Initialize JZZ globally and ensure all modules are properly loaded
let jzz;
try {
  // Initialize JZZ and wait for it to be ready
  jzz = JZZ();

  // Make sure MIDI modules are loaded
  if (typeof JZZ.MIDI === 'undefined') {
    JZZ.MIDI = {};
  }

  // Explicitly ensure SMF module is loaded and initialized
  if (typeof JZZ.MIDI.SMF !== 'function') {
    console.warn('JZZ.MIDI.SMF not available after import. Attempting to initialize it.');
    // Create a placeholder if not available
    JZZ.MIDI.SMF = function(type) {
      this.type = type || 0;
      this.tracks = [];
      this.push = function(track) { this.tracks.push(track); };
      this.dump = function() { 
        // Basic MIDI file header
        const header = [
          0x4D, 0x54, 0x68, 0x64, // MThd
          0x00, 0x00, 0x00, 0x06, // Header size
          0x00, this.type, // Format type (0 or 1)
          0x00, this.tracks.length, // Number of tracks
          0x00, 0x60, // Division (96 ticks per quarter note)
        ];

        // Process each track
        const trackChunks = this.tracks.map(track => {
          // Track header
          const trackHeader = [
            0x4D, 0x54, 0x72, 0x6B, // MTrk
            0x00, 0x00, 0x00, 0x00, // Placeholder for track length
          ];

          // Track data (simplified)
          const trackData = [];

          // Process track events if available
          if (track.events && Array.isArray(track.events)) {
            // Sort events by time
            const sortedEvents = [...track.events].sort((a, b) => a.time - b.time);

            let lastTime = 0;

            // Add each event
            sortedEvents.forEach(event => {
              // Calculate delta time
              const deltaTime = event.time - lastTime;
              lastTime = event.time;

              // Write variable-length delta time
              const deltaBytes = [];
              let value = deltaTime;

              if (value === 0) {
                deltaBytes.push(0);
              } else {
                while (value > 0) {
                  deltaBytes.unshift(value & 0x7F);
                  value >>= 7;
                  if (value > 0) {
                    deltaBytes[0] |= 0x80;
                  }
                }
              }

              // Add delta time bytes
              trackData.push(...deltaBytes);

              // Add event data if available
              if (event.msg && event.msg._data && Array.isArray(event.msg._data)) {
                trackData.push(...event.msg._data);
              }
            });
          }

          // End of track marker
          trackData.push(0x00); // Delta time
          trackData.push(0xFF, 0x2F, 0x00); // End of track meta event

          // Calculate track length
          const trackLength = trackData.length;
          trackHeader[4] = (trackLength >> 24) & 0xFF;
          trackHeader[5] = (trackLength >> 16) & 0xFF;
          trackHeader[6] = (trackLength >> 8) & 0xFF;
          trackHeader[7] = trackLength & 0xFF;

          // Combine header and data
          return [...trackHeader, ...trackData];
        });

        // Combine header and all track chunks
        const midiData = [
          ...header,
          ...trackChunks.flat()
        ];

        return new Uint8Array(midiData);
      };
      return this;
    };

    // Create MTrk constructor if needed
    JZZ.MIDI.SMF.MTrk = function() {
      this.events = [];
      this.add = function(time, msg) { this.events.push({time: time, msg: msg}); };
      return this;
    };
  }

  // Ensure MIDI.SysEx is available
  if (typeof JZZ.MIDI.SysEx !== 'function') {
    // Create a placeholder implementation
    JZZ.MIDI.SysEx = function(data) {
      if (!(this instanceof JZZ.MIDI.SysEx)) return new JZZ.MIDI.SysEx(data);
      this._data = Array.isArray(data) ? data : [];
      return this;
    };
  }

  // Ensure MIDI message creators are available
  if (typeof JZZ.MIDI.programChange !== 'function' || 
      typeof JZZ.MIDI.noteOn !== 'function' || 
      typeof JZZ.MIDI.noteOff !== 'function' || 
      typeof JZZ.MIDI.control !== 'function') {

    // Create placeholder implementations
    if (typeof JZZ.MIDI.programChange !== 'function') {
      JZZ.MIDI.programChange = function(channel, program) {
        return { 
          _data: [0xC0 | (channel & 0x0F), program & 0x7F],
          toString: function() { return 'Program Change'; }
        };
      };
    }

    if (typeof JZZ.MIDI.noteOn !== 'function') {
      JZZ.MIDI.noteOn = function(channel, note, velocity) {
        return { 
          _data: [0x90 | (channel & 0x0F), note & 0x7F, velocity & 0x7F],
          toString: function() { return 'Note On'; }
        };
      };
    }

    if (typeof JZZ.MIDI.noteOff !== 'function') {
      JZZ.MIDI.noteOff = function(channel, note, velocity) {
        return { 
          _data: [0x80 | (channel & 0x0F), note & 0x7F, velocity || 0],
          toString: function() { return 'Note Off'; }
        };
      };
    }

    if (typeof JZZ.MIDI.control !== 'function') {
      JZZ.MIDI.control = function(channel, controller, value) {
        return { 
          _data: [0xB0 | (channel & 0x0F), controller & 0x7F, value & 0x7F],
          toString: function() { return 'Control Change'; }
        };
      };
    }
  }

  // Register the synth
  if (JZZ.synth && typeof JZZ.synth.Tiny === 'object') {
    JZZ.synth.Tiny.register();
  }
} catch (e) {
  console.error('Error initializing JZZ globally:', e);
}

// We'll initialize the synth when needed

/**
 * Initialize JZZ
 * @returns {Promise<Object>} - JZZ instance
 */
export const initJZZ = async () => {
  try {

    const midi = await JZZ({
      sysex: true,
      engine: 'none'
    });
    return midi;
  } catch (err) {
    console.error('Error initializing JZZ:', err);
    return null;
  }
};

/**
 * Convert note name to MIDI number
 * @param {string} noteName - Note name (e.g., 'C4')
 * @returns {number} - MIDI note number
 */
export const noteToMidiNumber = (noteName) => {
  if (!noteName || typeof noteName !== 'string') {
    console.error('Invalid note name:', noteName);
    return 60; // Default to middle C (C4) if invalid
  }

  // Handle different note formats
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
    chordInstrument = 4,  // Electric Piano
    bassInstrument = 32,  // Acoustic Bass
    applyExpression = true,
    humanize = true
  } = options;

  const midi = await initJZZ();
  if (!midi) return null;

  try {
    if (JZZ.synth && typeof JZZ.synth.Tiny === 'object' && typeof JZZ.synth.Tiny.register === 'function') {
      JZZ.synth.Tiny.register();
    }
  } catch (e) {
    console.warn('Could not initialize JZZ synth:', e);
  }

  // Ensure MIDI.SMF is available
  if (typeof JZZ.MIDI.SMF !== 'function') {
    console.warn('JZZ.MIDI.SMF not available in exportMIDIWithJZZ, attempting to initialize it');

    // Create a placeholder if not available
    JZZ.MIDI.SMF = function(type) {
      this.type = type || 0;
      this.tracks = [];
      this.push = function(track) { this.tracks.push(track); };
      this.dump = function() { 
        // Basic MIDI file header
        const header = [
          0x4D, 0x54, 0x68, 0x64, // MThd
          0x00, 0x00, 0x00, 0x06, // Header size
          0x00, this.type, // Format type (0 or 1)
          0x00, this.tracks.length, // Number of tracks
          0x00, 0x60, // Division (96 ticks per quarter note)
        ];

        // Process each track
        const trackChunks = this.tracks.map(track => {
          // Track header
          const trackHeader = [
            0x4D, 0x54, 0x72, 0x6B, // MTrk
            0x00, 0x00, 0x00, 0x00, // Placeholder for track length
          ];

          // Track data (simplified)
          const trackData = [];

          // Process track events if available
          if (track.events && Array.isArray(track.events)) {
            // Sort events by time
            const sortedEvents = [...track.events].sort((a, b) => a.time - b.time);

            let lastTime = 0;

            // Add each event
            sortedEvents.forEach(event => {
              // Calculate delta time
              const deltaTime = event.time - lastTime;
              lastTime = event.time;

              // Write variable-length delta time
              const deltaBytes = [];
              let value = deltaTime;

              if (value === 0) {
                deltaBytes.push(0);
              } else {
                while (value > 0) {
                  deltaBytes.unshift(value & 0x7F);
                  value >>= 7;
                  if (value > 0) {
                    deltaBytes[0] |= 0x80;
                  }
                }
              }

              // Add delta time bytes
              trackData.push(...deltaBytes);

              // Add event data if available
              if (event.msg && event.msg._data && Array.isArray(event.msg._data)) {
                trackData.push(...event.msg._data);
              }
            });
          }

          // End of track marker
          trackData.push(0x00); // Delta time
          trackData.push(0xFF, 0x2F, 0x00); // End of track meta event

          // Calculate track length
          const trackLength = trackData.length;
          trackHeader[4] = (trackLength >> 24) & 0xFF;
          trackHeader[5] = (trackLength >> 16) & 0xFF;
          trackHeader[6] = (trackLength >> 8) & 0xFF;
          trackHeader[7] = trackLength & 0xFF;

          // Combine header and data
          return [...trackHeader, ...trackData];
        });

        // Combine header and all track chunks
        const midiData = [
          ...header,
          ...trackChunks.flat()
        ];

        return new Uint8Array(midiData);
      };
      return this;
    };

    // Create MTrk constructor if needed
    JZZ.MIDI.SMF.MTrk = function() {
      this.events = [];
      this.add = function(time, msg) { this.events.push({time: time, msg: msg}); };
      return this;
    };
  }

  // Create a new MIDI file
  const smf = new JZZ.MIDI.SMF(1); // Type 1 MIDI file (multiple tracks)

  // Ensure MIDI.SMF.MTrk is available
  if (typeof JZZ.MIDI.SMF.MTrk !== 'function') {
    console.warn('JZZ.MIDI.SMF.MTrk not available, creating a placeholder');

    // Create MTrk constructor if needed
    JZZ.MIDI.SMF.MTrk = function() {
      this.events = [];
      this.add = function(time, msg) { 
        if (!this.events) this.events = [];
        this.events.push({time: time, msg: msg}); 
      };
      return this;
    };
  }

  // Create tracks
  const controlTrack = new JZZ.MIDI.SMF.MTrk();
  const melodyTrack = includeMelody ? new JZZ.MIDI.SMF.MTrk() : null;
  const chordTrack = includeChords ? new JZZ.MIDI.SMF.MTrk() : null;
  const bassTrack = includeBass ? new JZZ.MIDI.SMF.MTrk() : null;


  // Add metadata using standard MIDI events
  try {
    // Create a simple meta event creator function
    const createMetaEvent = (type, data) => {
      // For meta events, we use 0xFF followed by the event type and length
      const bytes = [0xFF, type];

      if (typeof data === 'string') {
        // For text events, convert string to bytes
        const textBytes = Array.from(data).map(c => c.charCodeAt(0));
        bytes.push(textBytes.length, ...textBytes);
      } else if (Array.isArray(data)) {
        // For binary data, just add the bytes
        bytes.push(data.length, ...data);
      } else {
        // Default case, empty data
        bytes.push(0);
      }

      return {
        _data: bytes,
        toString: function() { return 'Meta Event'; }
      };
    };

    // Sequence name
    controlTrack.add(0, createMetaEvent(0x03, 'MIDI Melody & Chord Generator'));

    // Track names
    if (melodyTrack) {
      melodyTrack.add(0, createMetaEvent(0x03, 'Melody'));
    }
    if (chordTrack) {
      chordTrack.add(0, createMetaEvent(0x03, 'Chords'));
    }
    if (bassTrack) {
      bassTrack.add(0, createMetaEvent(0x03, 'Bass'));
    }

    // Set tempo (microseconds per quarter note)
    const tempo = melodyData?.tempo || chordData?.tempo || 120;
    const mspqn = Math.floor(60000000 / tempo);
    const tempoBytes = [(mspqn >> 16) & 0xFF, (mspqn >> 8) & 0xFF, mspqn & 0xFF];
    controlTrack.add(0, createMetaEvent(0x51, tempoBytes));

    // Set time signature (4/4)
    controlTrack.add(0, createMetaEvent(0x58, [0x04, 0x02, 0x18, 0x08]));

    console.log('Added metadata events successfully');
  } catch (error) {
    console.error('Error adding metadata events:', error);

    // Fallback to simpler approach if the above fails
    try {
      // Sequence name - simplified approach
      controlTrack.add(0, { _data: [0xFF, 0x03, 0x00] });

      // Set tempo (120 BPM)
      controlTrack.add(0, { _data: [0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20] });

      // Set time signature (4/4)
      controlTrack.add(0, { _data: [0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08] });

      console.log('Added fallback metadata events');
    } catch (fallbackError) {
      console.error('Error adding fallback metadata events:', fallbackError);
    }
  }


  // Add melody track
  if (melodyTrack && melodyData && melodyData.notes) {
    try {
      console.log('Adding melody track with', melodyData.notes.length, 'notes');

      // Create a helper function for MIDI messages
      const createMidiMessage = (status, data1, data2) => {
        return {
          _data: [status, data1, data2],
          toString: function() { return 'MIDI Message'; }
        };
      };

      // Set instrument with program change
      const programChangeStatus = 0xC0 | (melodyChannel & 0x0F);
      melodyTrack.add(0, createMidiMessage(programChangeStatus, melodyInstrument & 0x7F, 0));

      // Add notes
      let notesAdded = 0;

      // Log the first few notes for debugging
      console.log('First few melody notes:', melodyData.notes.slice(0, 3));

      melodyData.notes.forEach((note, index) => {
        try {
          console.log(`Processing melody note ${index}:`, note);

          if (!note.pitch) {
            console.error(`Melody note ${index} has no pitch:`, note);
            return; // Skip this note
          }

          const pitch = noteToMidiNumber(note.pitch);
          console.log(`Converted pitch ${note.pitch} to MIDI number ${pitch}`);

          const velocity = Math.floor((note.velocity || 0.8) * 127); // Default velocity if not provided
          const duration = Math.max(1, Math.floor(note.duration * 480)); // 480 ticks per quarter note
          const startTime = Math.max(0, Math.floor(note.startTime * 480));

          console.log(`Note parameters - velocity: ${velocity}, duration: ${duration}, startTime: ${startTime}`);

          // Note on message
          const noteOnStatus = 0x90 | (melodyChannel & 0x0F);
          const noteOnMsg = createMidiMessage(noteOnStatus, pitch & 0x7F, velocity & 0x7F);
          console.log(`Adding note ON message at time ${startTime}:`, noteOnMsg._data);
          melodyTrack.add(startTime, noteOnMsg);

          // Note off message
          const noteOffStatus = 0x80 | (melodyChannel & 0x0F);
          const noteOffMsg = createMidiMessage(noteOffStatus, pitch & 0x7F, 0);
          console.log(`Adding note OFF message at time ${startTime + duration}:`, noteOffMsg._data);
          melodyTrack.add(startTime + duration, noteOffMsg);

          notesAdded++;

          // Only log detailed info for the first few notes to avoid console spam
          if (index >= 5) {
            console.log = console.log.bind(console); // Restore normal logging
          }
        } catch (noteError) {
          console.error(`Error adding melody note ${index}:`, noteError, note);
        }
      });

      console.log('Added', notesAdded, 'melody notes successfully');
    } catch (error) {
      console.error('Error adding melody track:', error);
    }

    // Add expression controls if enabled
    if (applyExpression) {
      try {
        console.log('Adding expression controls to melody track');

        // Create a helper function for control change messages
        const createControlMessage = (channel, controller, value) => {
          return {
            _data: [0xB0 | (channel & 0x0F), controller & 0x7F, value & 0x7F],
            toString: function() { return 'Control Change'; }
          };
        };

        // Add initial volume and expression
        melodyTrack.add(0, createControlMessage(melodyChannel, 7, 100)); // Initial volume
        melodyTrack.add(0, createControlMessage(melodyChannel, 11, 127)); // Initial expression

        // Calculate total duration of the melody
        const totalDuration = melodyData.notes.reduce(
          (max, note) => Math.max(max, note.startTime + note.duration),
          0
        ) * 480;

        // Add expression changes throughout the melody
        let expressionChangesAdded = 0;

        for (let i = 0; i < 5; i++) {
          try {
            const time = Math.floor(totalDuration * i / 4);
            const value = 80 + Math.floor(i * 10);

            melodyTrack.add(time, createControlMessage(melodyChannel, 11, value));
            expressionChangesAdded++;
          } catch (expressionError) {
            console.error('Error adding expression change:', expressionError);
          }
        }

        console.log('Added', expressionChangesAdded, 'expression changes successfully');
      } catch (error) {
        console.error('Error adding expression controls:', error);
      }
    }
  }

  // Add chord track
  if (chordTrack && chordData && chordData.progression) {
    try {
      console.log('Adding chord track with', chordData.progression.length, 'chords');

      // Create a helper function for MIDI messages
      const createMidiMessage = (status, data1, data2) => {
        return {
          _data: [status, data1, data2],
          toString: function() { return 'MIDI Message'; }
        };
      };

      // Set instrument with program change
      const programChangeStatus = 0xC0 | (chordChannel & 0x0F);
      chordTrack.add(0, createMidiMessage(programChangeStatus, chordInstrument & 0x7F, 0));

      // Add chords
      let chordsAdded = 0;
      let notesAdded = 0;

      // Log the first few chords for debugging
      console.log('First few chords:', chordData.progression.slice(0, 3));

      chordData.progression.forEach((chord, chordIndex) => {
        try {
          console.log(`Processing chord ${chordIndex}:`, chord);

          if (!chord.notes || !Array.isArray(chord.notes) || chord.notes.length === 0) {
            console.warn(`Skipping chord ${chordIndex} with no notes:`, chord);
            return;
          }

          console.log(`Chord ${chordIndex} notes:`, chord.notes);

          const startTime = Math.max(0, Math.floor(chord.position * 4 * 480)); // 4 beats per bar, 480 ticks per quarter
          const duration = Math.max(1, Math.floor(chord.duration * 4 * 480));
          const velocity = 80;

          console.log(`Chord parameters - position: ${chord.position}, startTime: ${startTime}, duration: ${duration}`);

          // Add each note in the chord
          chord.notes.forEach((noteName, noteIndex) => {
            try {
              console.log(`Processing chord ${chordIndex} note ${noteIndex}: ${noteName}`);

              if (!noteName || typeof noteName !== 'string') {
                console.error(`Invalid note name in chord ${chordIndex}:`, noteName);
                return; // Skip this note
              }

              const pitch = noteToMidiNumber(noteName);
              console.log(`Converted chord note ${noteName} to MIDI number ${pitch}`);

              if (isNaN(pitch) || pitch < 0 || pitch > 127) {
                console.warn(`Invalid pitch for chord ${chordIndex} note:`, noteName, pitch);
                return;
              }

              // Note on message
              const noteOnStatus = 0x90 | (chordChannel & 0x0F);
              const noteOnMsg = createMidiMessage(noteOnStatus, pitch & 0x7F, velocity & 0x7F);
              console.log(`Adding chord note ON message at time ${startTime}:`, noteOnMsg._data);
              chordTrack.add(startTime, noteOnMsg);

              // Note off message
              const noteOffStatus = 0x80 | (chordChannel & 0x0F);
              const noteOffMsg = createMidiMessage(noteOffStatus, pitch & 0x7F, 0);
              console.log(`Adding chord note OFF message at time ${startTime + duration}:`, noteOffMsg._data);
              chordTrack.add(startTime + duration, noteOffMsg);

              notesAdded++;
            } catch (noteError) {
              console.error(`Error adding chord ${chordIndex} note ${noteIndex}:`, noteError, noteName);
            }
          });

          chordsAdded++;

          // Only log detailed info for the first few chords to avoid console spam
          if (chordIndex >= 3) {
            console.log = console.log.bind(console); // Restore normal logging
          }
        } catch (chordError) {
          console.error(`Error adding chord ${chordIndex}:`, chordError, chord);
        }
      });

      console.log('Added', chordsAdded, 'chords with', notesAdded, 'notes successfully');
    } catch (error) {
      console.error('Error adding chord track:', error);
    }
  }

  // Add bass track
  if (bassTrack && chordData && chordData.progression) {
    try {
      console.log('Adding bass track with', chordData.progression.length, 'bass notes');

      // Create a helper function for MIDI messages
      const createMidiMessage = (status, data1, data2) => {
        return {
          _data: [status, data1, data2],
          toString: function() { return 'MIDI Message'; }
        };
      };

      // Set instrument with program change
      const programChangeStatus = 0xC0 | (bassChannel & 0x0F);
      bassTrack.add(0, createMidiMessage(programChangeStatus, bassInstrument & 0x7F, 0));

      // Add bass notes (root of each chord)
      let bassNotesAdded = 0;

      // Log the first few chords for bass line debugging
      console.log('First few chords for bass line:', chordData.progression.slice(0, 3));

      chordData.progression.forEach((chord, chordIndex) => {
        try {
          console.log(`Processing bass note for chord ${chordIndex}:`, chord);

          if (!chord.root) {
            console.warn(`Skipping chord ${chordIndex} with no root:`, chord);
            return;
          }

          console.log(`Chord ${chordIndex} root:`, chord.root);

          const startTime = Math.max(0, Math.floor(chord.position * 4 * 480));
          const duration = Math.max(1, Math.floor(chord.duration * 4 * 480));

          console.log(`Bass note parameters - position: ${chord.position}, startTime: ${startTime}, duration: ${duration}`);

          // Get the root note and transpose it one octave lower
          let rootNote = chord.root;
          // If the root doesn't have an octave, add octave 3
          if (!/\d/.test(rootNote)) {
            rootNote += '3';
            console.log(`Added octave to root note: ${rootNote}`);
          }

          let pitch = noteToMidiNumber(rootNote);
          console.log(`Converted root note ${rootNote} to MIDI number ${pitch}`);

          // Transpose one octave lower
          const originalPitch = pitch;
          pitch = Math.max(0, pitch - 12);
          console.log(`Transposed bass pitch from ${originalPitch} to ${pitch} (one octave lower)`);

          if (isNaN(pitch) || pitch < 0 || pitch > 127) {
            console.warn(`Invalid pitch for bass note in chord ${chordIndex}:`, rootNote, pitch);
            return;
          }

          const velocity = 100;

          // Note on message
          const noteOnStatus = 0x90 | (bassChannel & 0x0F);
          const noteOnMsg = createMidiMessage(noteOnStatus, pitch & 0x7F, velocity & 0x7F);
          console.log(`Adding bass note ON message at time ${startTime}:`, noteOnMsg._data);
          bassTrack.add(startTime, noteOnMsg);

          // Note off message
          const noteOffStatus = 0x80 | (bassChannel & 0x0F);
          const noteOffMsg = createMidiMessage(noteOffStatus, pitch & 0x7F, 0);
          console.log(`Adding bass note OFF message at time ${startTime + duration}:`, noteOffMsg._data);
          bassTrack.add(startTime + duration, noteOffMsg);

          bassNotesAdded++;

          // Only log detailed info for the first few bass notes to avoid console spam
          if (chordIndex >= 3) {
            console.log = console.log.bind(console); // Restore normal logging
          }
        } catch (bassError) {
          console.error(`Error adding bass note for chord ${chordIndex}:`, bassError, chord);
        }
      });

      console.log('Added', bassNotesAdded, 'bass notes successfully');
    } catch (error) {
      console.error('Error adding bass track:', error);
    }
  }

  // Add end-of-track markers to each track
  try {
    // Create a helper function for meta events
    const createMetaEvent = (type, data) => {
      // For meta events, we use 0xFF followed by the event type and length
      const bytes = [0xFF, type];

      if (typeof data === 'string') {
        // For text events, convert string to bytes
        const textBytes = Array.from(data).map(c => c.charCodeAt(0));
        bytes.push(textBytes.length, ...textBytes);
      } else if (Array.isArray(data)) {
        // For binary data, just add the bytes
        bytes.push(data.length, ...data);
      } else {
        // Default case, empty data
        bytes.push(0);
      }

      return {
        _data: bytes,
        toString: function() { return 'Meta Event'; }
      };
    };

    // End of track meta event (type 0x2F with empty data)
    const endOfTrackEvent = createMetaEvent(0x2F, []);

    // Calculate the maximum time for each track
    let maxControlTime = 0;
    let maxMelodyTime = 0;
    let maxChordTime = 0;
    let maxBassTime = 0;

    // Find the maximum time in melody track
    if (melodyTrack && melodyTrack.events && melodyTrack.events.length > 0) {
      maxMelodyTime = melodyTrack.events.reduce((max, event) => Math.max(max, event.time), 0);
    }

    // Find the maximum time in chord track
    if (chordTrack && chordTrack.events && chordTrack.events.length > 0) {
      maxChordTime = chordTrack.events.reduce((max, event) => Math.max(max, event.time), 0);
    }

    // Find the maximum time in bass track
    if (bassTrack && bassTrack.events && bassTrack.events.length > 0) {
      maxBassTime = bassTrack.events.reduce((max, event) => Math.max(max, event.time), 0);
    }

    // Add end-of-track markers
    controlTrack.add(Math.max(maxControlTime + 1, 1), endOfTrackEvent);
    if (melodyTrack) melodyTrack.add(Math.max(maxMelodyTime + 1, 1), endOfTrackEvent);
    if (chordTrack) chordTrack.add(Math.max(maxChordTime + 1, 1), endOfTrackEvent);
    if (bassTrack) bassTrack.add(Math.max(maxBassTime + 1, 1), endOfTrackEvent);

    console.log('Added end-of-track markers to all tracks');
  } catch (error) {
    console.error('Error adding end-of-track markers:', error);
  }

  // Add tracks to SMF
  smf.push(controlTrack);
  if (melodyTrack) smf.push(melodyTrack);
  if (chordTrack) smf.push(chordTrack);
  if (bassTrack) smf.push(bassTrack);

  // Log track information for debugging
  console.log('MIDI tracks:', {
    controlTrack: controlTrack.events ? controlTrack.events.length : 'unknown',
    melodyTrack: melodyTrack ? (melodyTrack.events ? melodyTrack.events.length : 'unknown') : 'none',
    chordTrack: chordTrack ? (chordTrack.events ? chordTrack.events.length : 'unknown') : 'none',
    bassTrack: bassTrack ? (bassTrack.events ? bassTrack.events.length : 'unknown') : 'none'
  });

  // Generate MIDI data
  const midiData = smf.dump();
  console.log('Generated MIDI data from SMF:', midiData ? midiData.length : 'null', 'bytes');
  return midiData;
};

/**
 * Export MIDI file with JZZ and download it
 * @param {Object} melodyData - Melody data
 * @param {Object} chordData - Chord progression data
 * @param {string} fileName - File name
 * @param {Object} options - Export options
 */
export const exportAndDownloadMIDI = async (melodyData, chordData, fileName, options = {}) => {
  try {
    // Log detailed information about the input data
    console.log('Exporting MIDI with data:', { 
      melodyData: melodyData ? { 
        notes: melodyData.notes ? melodyData.notes.length : 0,
        tempo: melodyData.tempo,
        // Log the first few notes for debugging
        sampleNotes: melodyData.notes && melodyData.notes.length > 0 
          ? melodyData.notes.slice(0, 3).map(note => ({
              pitch: note.pitch,
              startTime: note.startTime,
              duration: note.duration,
              velocity: note.velocity
            }))
          : 'No notes'
      } : null, 
      chordData: chordData ? {
        progression: chordData.progression ? chordData.progression.length : 0,
        tempo: chordData.tempo,
        // Log the first few chords for debugging
        sampleChords: chordData.progression && chordData.progression.length > 0
          ? chordData.progression.slice(0, 3).map(chord => ({
              root: chord.root,
              notes: chord.notes,
              position: chord.position,
              duration: chord.duration
            }))
          : 'No chords'
      } : null,
      fileName: fileName,
      options: options
    });

    // Check if the data has the expected structure
    if (melodyData && (!melodyData.notes || !Array.isArray(melodyData.notes))) {
      console.error('Invalid melody data structure - missing or invalid notes array:', melodyData);
    }

    if (chordData && (!chordData.progression || !Array.isArray(chordData.progression))) {
      console.error('Invalid chord data structure - missing or invalid progression array:', chordData);
    }

    const midiData = await exportMIDIWithJZZ(melodyData, chordData, fileName, options);
    if (!midiData) {
      console.error('Failed to generate MIDI data');
      return false;
    }

    console.log('Generated MIDI data size:', midiData.length, 'bytes');
    if (midiData.length < 20) {
      console.warn('MIDI data is suspiciously small, might be empty or invalid');
    }

    // Verify that the MIDI data is not empty
    if (!midiData || midiData.length < 14) { // Minimum size for a valid MIDI file header
      console.error('Generated MIDI data is empty or too small to be valid');
      return false;
    }

    try {
      // Log the first few bytes of the MIDI data for debugging
      const headerBytes = Array.from(midiData.slice(0, 14))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');
      console.log('MIDI header bytes:', headerBytes);

      // Verify MIDI header
      if (midiData[0] !== 0x4D || midiData[1] !== 0x54 || midiData[2] !== 0x68 || midiData[3] !== 0x64) {
        console.error('Invalid MIDI header - missing MThd signature');
        return false;
      }

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
