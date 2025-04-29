import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

// Import utility functions from chords.js for backward compatibility
import {
  applyVoiceLeading
} from '../utils/chords';

// Import Tonal.js utility functions
import {
  getKeys,
  getCommonProgressions,
  generateChordProgression,
  getChordNotes
} from '../utils/tonalUtils';

// Import SoundFont utility functions
import {
  loadInstrument,
  getAvailableInstruments,
  playChordProgressionWithSoundFont,
  stopAllSounds
} from '../utils/soundfontUtils';

// Define keys with their full names for Tonal.js compatibility
const keyOptions = [
  'C major', 'C# major', 'D major', 'Eb major', 'E major', 'F major',
  'F# major', 'G major', 'Ab major', 'A major', 'Bb major', 'B major',
  'A minor', 'Bb minor', 'B minor', 'C minor', 'C# minor', 'D minor',
  'Eb minor', 'E minor', 'F minor', 'F# minor', 'G minor', 'G# minor'
];

function ChordGenerator({ onChordGenerated }) {
  const [selectedKey, setSelectedKey] = useState('C major');
  const [selectedProgression, setSelectedProgression] = useState('Basic I-IV-V-I');
  const [tempo, setTempo] = useState(120);
  const [chordDuration, setChordDuration] = useState(1); // in bars
  const [progression, setProgression] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // New state variables for advanced features
  const [useVoiceLeading, setUseVoiceLeading] = useState(false);
  const [useInversions, setUseInversions] = useState(false);
  const [inversion, setInversion] = useState(0);
  const [useExtendedChords, setUseExtendedChords] = useState(false);
  const [autoRandomize, setAutoRandomize] = useState(true); // Auto-randomize is enabled by default

  // State for available progressions
  const [availableProgressions, setAvailableProgressions] = useState({});

  // State for SoundFont instruments
  const [useSoundFont, setUseSoundFont] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState('acoustic_grand_piano');
  const [availableInstruments, setAvailableInstruments] = useState({});
  const [instrumentLoading, setInstrumentLoading] = useState(false);

  // Refs for audio context and instrument
  const audioContextRef = useRef(null);
  const instrumentRef = useRef(null);

  // Initialize Tone.js synth for fallback
  const synth = new Tone.PolySynth(Tone.Synth).toDestination();

  // Load available progressions and instruments on component mount
  useEffect(() => {
    setAvailableProgressions(getCommonProgressions());
    setAvailableInstruments(getAvailableInstruments());

    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Load default instrument
    loadSoundFontInstrument('acoustic_grand_piano');

    // Cleanup on unmount
    return () => {
      if (instrumentRef.current) {
        stopAllSounds(instrumentRef.current);
      }
    };
  }, []);

  // Load a SoundFont instrument
  const loadSoundFontInstrument = async (instrumentName) => {
    if (!audioContextRef.current) return;

    setInstrumentLoading(true);
    try {
      const instrument = await loadInstrument(instrumentName, audioContextRef.current);
      instrumentRef.current = instrument;
      setInstrumentLoading(false);
    } catch (error) {
      console.error('Error loading instrument:', error);
      setInstrumentLoading(false);
      setUseSoundFont(false); // Fall back to Tone.js
    }
  };

  // These functions are now imported from the utility file

  // Generate chord progression using Tonal.js
  const generateProgression = () => {
    // Get the progression pattern from available progressions
    const progressionPattern = availableProgressions[selectedProgression] || ['I', 'IV', 'V', 'I'];

    // Reset advanced options before applying new ones
    const resetOptions = () => {
      setUseExtendedChords(false);
      setUseVoiceLeading(false);
      setUseInversions(false);
      setInversion(0);
    };

    // Randomly apply advanced options for variety
    const randomizeOptions = () => {
      // Reset options first
      resetOptions();

      // 50% chance to use extended chords
      const shouldUseExtendedChords = Math.random() > 0.5;
      if (shouldUseExtendedChords) {
        setUseExtendedChords(true);
      }

      // 40% chance to use voice leading
      const shouldUseVoiceLeading = Math.random() > 0.6;
      if (shouldUseVoiceLeading) {
        setUseVoiceLeading(true);
      }

      // 30% chance to use inversions
      const shouldUseInversions = Math.random() > 0.7;
      if (shouldUseInversions) {
        setUseInversions(true);
        // Random inversion level (0-2)
        const randomInversion = Math.floor(Math.random() * 3);
        setInversion(randomInversion);
      }
    };

    // Apply random options if auto-randomize is enabled
    if (autoRandomize) {
      randomizeOptions();
    }

    // Generate the chord progression using Tonal.js
    let chords = generateChordProgression(selectedKey, progressionPattern, useExtendedChords);

    // Format the chords for our application
    chords = chords.map((chord, index) => {
      // Get the chord notes with octave information
      let notes = chord.notes;

      // Apply inversions if enabled
      if (useInversions && inversion > 0) {
        // Simple inversion implementation - move the first n notes up an octave
        for (let i = 0; i < inversion && i < notes.length; i++) {
          const note = notes[i];
          const noteName = note.slice(0, -1);
          const octave = parseInt(note.slice(-1));
          notes[i] = `${noteName}${octave + 1}`;
        }
      }

      return {
        root: chord.root,
        type: chord.type,
        notes: notes,
        duration: chordDuration,
        position: index * chordDuration,
        symbol: chord.symbol,
        degree: chord.degree
      };
    });

    // Apply voice leading if enabled
    if (useVoiceLeading) {
      chords = applyVoiceLeading(chords);
    }

    const progressionData = {
      key: selectedKey,
      progression: chords,
      useVoiceLeading,
      useInversions,
      inversion,
      useExtendedChords
    };

    setProgression(progressionData);

    // Call the callback function if provided
    if (onChordGenerated) {
      onChordGenerated(progressionData);
    }

    return chords;
  };

  // Play the generated chord progression
  const playProgression = async () => {
    if (isPlaying) {
      // Stop playing
      if (useSoundFont && instrumentRef.current) {
        stopAllSounds(instrumentRef.current);
      } else {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
      setIsPlaying(false);
      return;
    }

    // Generate progression if not already generated
    const chords = progression ? progression.progression : generateProgression();

    // Play using SoundFont if available, otherwise fall back to Tone.js
    if (useSoundFont && instrumentRef.current) {
      try {
        setIsPlaying(true);

        // Play the chord progression with SoundFont
        await playChordProgressionWithSoundFont(instrumentRef.current, chords, tempo);

        // Set isPlaying to false when done
        setIsPlaying(false);
      } catch (error) {
        console.error('Error playing with SoundFont:', error);
        // Fall back to Tone.js
        playWithToneJs(chords);
      }
    } else {
      // Use Tone.js as fallback
      playWithToneJs(chords);
    }
  };

  // Play using Tone.js (fallback method)
  const playWithToneJs = (chords) => {
    // Set the tempo
    Tone.Transport.bpm.value = tempo;

    // Schedule the chords
    const now = Tone.now();
    const secondsPerBar = 60 / tempo * 4; // 4 beats per bar

    chords.forEach((chord, index) => {
      const startTime = now + (index * chord.duration * secondsPerBar);
      const duration = chord.duration * secondsPerBar;

      synth.triggerAttackRelease(chord.notes, duration, startTime);
    });

    setIsPlaying(true);

    // Stop playing after the progression is complete
    const totalDuration = chords.reduce((sum, chord) => sum + chord.duration, 0) * secondsPerBar * 1000;
    setTimeout(() => {
      setIsPlaying(false);
    }, totalDuration + 500); // Add a small buffer
  };

  return (
    <div className="chord-generator">
      <h2>Chord Generator</h2>

      <div className="controls">
        <div className="control-group">
          <label>
            Key:
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
            >
              {keyOptions.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="control-group">
          <label>
            Progression:
            <select
              value={selectedProgression}
              onChange={(e) => setSelectedProgression(e.target.value)}
            >
              {Object.keys(availableProgressions).map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="control-group">
          <label>
            Tempo (BPM):
            <input
              type="range"
              min="60"
              max="180"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
            />
            <span>{tempo} BPM</span>
          </label>
        </div>

        <div className="control-group">
          <label>
            Chord Duration (bars):
            <input
              type="number"
              min="0.5"
              max="4"
              step="0.5"
              value={chordDuration}
              onChange={(e) => setChordDuration(parseFloat(e.target.value))}
            />
          </label>
        </div>

        {/* Advanced controls */}
        <div className="advanced-controls">
          <h3>Advanced Options</h3>

          <div className="control-group">
            <label>
              Use Voice Leading:
              <input
                type="checkbox"
                checked={useVoiceLeading}
                onChange={(e) => setUseVoiceLeading(e.target.checked)}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              Use Inversions:
              <input
                type="checkbox"
                checked={useInversions}
                onChange={(e) => setUseInversions(e.target.checked)}
              />
            </label>
          </div>

          {useInversions && (
            <div className="control-group">
              <label>
                Inversion:
                <select
                  value={inversion}
                  onChange={(e) => setInversion(parseInt(e.target.value))}
                >
                  <option value="0">Root Position</option>
                  <option value="1">First Inversion</option>
                  <option value="2">Second Inversion</option>
                  <option value="3">Third Inversion</option>
                </select>
              </label>
            </div>
          )}

          <div className="control-group">
            <label>
              Use Extended Chords:
              <input
                type="checkbox"
                checked={useExtendedChords}
                onChange={(e) => setUseExtendedChords(e.target.checked)}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              Auto-Randomize Options:
              <input
                type="checkbox"
                checked={autoRandomize}
                onChange={(e) => setAutoRandomize(e.target.checked)}
              />
              <span className="tooltip">(Automatically applies random advanced options for variety)</span>
            </label>
          </div>

          <h3>Sound Options</h3>

          <div className="control-group">
            <label>
              Use Realistic Instrument Sounds:
              <input
                type="checkbox"
                checked={useSoundFont}
                onChange={(e) => setUseSoundFont(e.target.checked)}
              />
            </label>
          </div>

          {useSoundFont && (
            <div className="control-group">
              <label>
                Instrument:
                <select
                  value={selectedInstrument}
                  onChange={(e) => {
                    setSelectedInstrument(e.target.value);
                    loadSoundFontInstrument(e.target.value);
                  }}
                  disabled={instrumentLoading}
                >
                  {Object.entries(availableInstruments).map(([value, name]) => (
                    <option key={value} value={value}>{name}</option>
                  ))}
                </select>
              </label>
              {instrumentLoading && <span className="loading-indicator">Loading...</span>}
            </div>
          )}
        </div>
      </div>

      <div className="actions">
        <button onClick={generateProgression}>Generate Progression</button>
        <button onClick={playProgression}>
          {isPlaying ? 'Stop Playing' : 'Play Progression'}
        </button>
      </div>

      {progression && (
        <div className="progression-info">
          <h3>Generated Chord Progression</h3>
          <p>Key: {progression.key}</p>
          <div className="chord-list">
            {progression.progression.map((chord, index) => (
              <div key={index} className="chord">
                <strong>{chord.symbol || `${chord.root.slice(0, -1)}${chord.type}`}</strong>
                <span className="chord-degree">{chord.degree}</span>
                <span className="chord-notes">{chord.notes.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChordGenerator;
