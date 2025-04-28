// JZZ.js integration for advanced MIDI features

import JZZ from 'jzz';
import 'jzz-midi-smf'; // For Standard MIDI File support

/**
 * Initialize JZZ
 * @returns {Promise<Object>} - JZZ instance
 */
export const initJZZ = async () => {
  try {
    const midi = await JZZ();
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
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const note = noteName.slice(0, -1);
  const octave = parseInt(noteName.slice(-1));
  return notes.indexOf(note) + (octave + 1) * 12;
};

/**
 * Export MIDI with JZZ (more advanced features)
 * @param {Object} melodyData - Melody data
 * @param {Object} chordData - Chord progression data
 * @param {Object} options - Export options
 * @returns {Promise<Uint8Array>} - MIDI file data
 */
export const exportMIDIWithJZZ = async (melodyData, chordData, options = {}) => {
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
  
  // Create a new MIDI file
  const smf = new JZZ.MIDI.SMF(1); // Type 1 MIDI file (multiple tracks)
  
  // Create tracks
  const controlTrack = new JZZ.MIDI.SMF.MTrk();
  const melodyTrack = includeMelody ? new JZZ.MIDI.SMF.MTrk() : null;
  const chordTrack = includeChords ? new JZZ.MIDI.SMF.MTrk() : null;
  const bassTrack = includeBass ? new JZZ.MIDI.SMF.MTrk() : null;
  
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
  if (melodyTrack && melodyData && melodyData.notes) {
    // Set instrument
    melodyTrack.add(0, JZZ.MIDI.programChange(melodyChannel, melodyInstrument));
    
    // Add notes
    melodyData.notes.forEach(note => {
      const pitch = noteToMidiNumber(note.pitch);
      const velocity = Math.floor(note.velocity * 127);
      const duration = note.duration * 480; // 480 ticks per quarter note
      const startTime = note.startTime * 480;
      
      melodyTrack.add(startTime, JZZ.MIDI.noteOn(melodyChannel, pitch, velocity));
      melodyTrack.add(startTime + duration, JZZ.MIDI.noteOff(melodyChannel, pitch));
    });
    
    // Add expression if enabled
    if (applyExpression) {
      // Add volume controller
      melodyTrack.add(0, JZZ.MIDI.control(melodyChannel, 7, 100)); // Initial volume
      
      // Add expression controller
      melodyTrack.add(0, JZZ.MIDI.control(melodyChannel, 11, 127)); // Initial expression
      
      // Add some expression changes
      const totalDuration = melodyData.notes.reduce(
        (max, note) => Math.max(max, note.startTime + note.duration), 
        0
      ) * 480;
      
      // Crescendo
      for (let i = 0; i < 5; i++) {
        const time = totalDuration * i / 4;
        const value = 80 + Math.floor(i * 10);
        melodyTrack.add(time, JZZ.MIDI.control(melodyChannel, 11, value));
      }
    }
  }
  
  // Add chord track
  if (chordTrack && chordData && chordData.progression) {
    // Set instrument
    chordTrack.add(0, JZZ.MIDI.programChange(chordChannel, chordInstrument));
    
    // Add chords
    chordData.progression.forEach(chord => {
      const startTime = chord.position * 4 * 480; // 4 beats per bar, 480 ticks per quarter
      const duration = chord.duration * 4 * 480;
      
      // Add each note in the chord
      chord.notes.forEach(noteName => {
        const pitch = noteToMidiNumber(noteName);
        const velocity = 80;
        
        chordTrack.add(startTime, JZZ.MIDI.noteOn(chordChannel, pitch, velocity));
        chordTrack.add(startTime + duration, JZZ.MIDI.noteOff(chordChannel, pitch));
      });
    });
  }
  
  // Add bass track
  if (bassTrack && chordData && chordData.progression) {
    // Set instrument
    bassTrack.add(0, JZZ.MIDI.programChange(bassChannel, bassInstrument));
    
    // Add bass notes (root of each chord)
    chordData.progression.forEach(chord => {
      const startTime = chord.position * 4 * 480;
      const duration = chord.duration * 4 * 480;
      const rootNote = chord.root;
      const pitch = noteToMidiNumber(rootNote) - 12; // One octave lower
      const velocity = 100;
      
      bassTrack.add(startTime, JZZ.MIDI.noteOn(bassChannel, pitch, velocity));
      bassTrack.add(startTime + duration, JZZ.MIDI.noteOff(bassChannel, pitch));
    });
  }
  
  // Add tracks to SMF
  smf.push(controlTrack);
  if (melodyTrack) smf.push(melodyTrack);
  if (chordTrack) smf.push(chordTrack);
  if (bassTrack) smf.push(bassTrack);
  
  // Generate MIDI data
  return smf.dump();
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
    const midiData = await exportMIDIWithJZZ(melodyData, chordData, options);
    if (!midiData) {
      console.error('Failed to generate MIDI data');
      return false;
    }
    
    // Create a Blob from the MIDI data
    const midiBlob = new Blob([midiData], { type: 'audio/midi' });
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(midiBlob);
    downloadLink.download = `${fileName}.mid`;
    
    // Trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    return true;
  } catch (error) {
    console.error('Error exporting MIDI:', error);
    return false;
  }
};