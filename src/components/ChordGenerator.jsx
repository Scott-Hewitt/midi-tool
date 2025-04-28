import { useState, useEffect, useRef, lazy, Suspense } from 'react';
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

// Import storage utilities
import { saveToLocalStorage, generateStorageKey, isLocalStorageAvailable } from '../utils/storageUtils';

// Lazy load components for better performance
const SavedContent = lazy(() => import('./SavedContent'));

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

  // State for available progressions
  const [availableProgressions, setAvailableProgressions] = useState({});

  // State for SoundFont instruments
  const [useSoundFont, setUseSoundFont] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState('acoustic_grand_piano');
  const [availableInstruments, setAvailableInstruments] = useState({});
  const [instrumentLoading, setInstrumentLoading] = useState(false);

  // State variables for save/load functionality
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedContent, setShowSavedContent] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info', 'success', 'error', 'warning'

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
        root: chord.symbol.split('m')[0].split('7')[0].split('maj')[0], // Extract root note
        type: chord.symbol.includes('maj7') ? 'maj7' : 
              chord.symbol.includes('m7') ? 'min7' : 
              chord.symbol.includes('m') ? 'min' : 
              chord.symbol.includes('7') ? '7' : 'maj',
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

  // Save the current chord progression to local storage
  const saveChordProgression = () => {
    if (!progression) {
      setSaveStatus('No chord progression to save. Please generate a progression first.');
      setStatusType('warning');
      clearSaveStatus();
      return;
    }

    // Check if local storage is available
    if (!isLocalStorageAvailable()) {
      setSaveStatus('Local storage is not available in your browser. Unable to save chord progression.');
      setStatusType('error');
      clearSaveStatus();
      return;
    }

    // Show the save dialog
    setShowSaveDialog(true);
  };

  // Handle the actual saving after name is entered
  const handleSaveConfirm = () => {
    if (!saveName.trim()) {
      setSaveStatus('Please enter a name for your chord progression.');
      setStatusType('warning');
      return;
    }

    try {
      // Generate a unique key for this chord progression
      const key = generateStorageKey('chord', saveName);

      // Save the chord progression to local storage
      const success = saveToLocalStorage(key, progression);

      if (success) {
        setSaveStatus(`Chord progression "${saveName}" saved successfully!`);
        setStatusType('success');
        // Close the save dialog
        setShowSaveDialog(false);
        // Reset the save name
        setSaveName('');
      } else {
        setSaveStatus('Failed to save chord progression. Please try again.');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error saving chord progression:', error);
      setSaveStatus(`Error saving chord progression: ${error.message}`);
      setStatusType('error');
    }

    clearSaveStatus();
  };

  // Handle loading a chord progression from SavedContent
  const handleLoadChordProgression = (loadedProgression) => {
    if (!loadedProgression) {
      setSaveStatus('Failed to load chord progression. The data may be corrupted.');
      setStatusType('error');
      clearSaveStatus();
      return;
    }

    try {
      // Update all state variables with the loaded chord progression data
      setSelectedKey(loadedProgression.key || 'C major');
      setUseVoiceLeading(loadedProgression.useVoiceLeading || false);
      setUseInversions(loadedProgression.useInversions || false);
      setInversion(loadedProgression.inversion || 0);
      setUseExtendedChords(loadedProgression.useExtendedChords || false);

      // Set the progression
      setProgression(loadedProgression);

      // Close the saved content panel
      setShowSavedContent(false);

      // Show success message
      setSaveStatus('Chord progression loaded successfully!');
      setStatusType('success');

      // Call the callback function if provided
      if (onChordGenerated) {
        onChordGenerated(loadedProgression);
      }
    } catch (error) {
      console.error('Error loading chord progression:', error);
      setSaveStatus(`Error loading chord progression: ${error.message}`);
      setStatusType('error');
    }

    clearSaveStatus();
  };

  // Clear save status message after a delay
  const clearSaveStatus = (delay = 3000) => {
    setTimeout(() => {
      setSaveStatus('');
      setStatusType('info');
    }, delay);
  };

  return (
    <div className="chord-generator" role="region" aria-label="Chord Generator">
      <h2 id="chord-generator-title">Chord Generator</h2>

      <form className="controls" onSubmit={(e) => e.preventDefault()} aria-labelledby="chord-generator-title">
        <div className="control-group">
          <label htmlFor="key-select">
            Key:
          </label>
          <select 
            id="key-select"
            value={selectedKey} 
            onChange={(e) => setSelectedKey(e.target.value)}
            aria-describedby="key-description"
          >
            {keyOptions.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          <span id="key-description" className="sr-only">Select the musical key for your chord progression</span>
        </div>

        <div className="control-group">
          <label htmlFor="progression-select">
            Progression:
          </label>
          <select 
            id="progression-select"
            value={selectedProgression} 
            onChange={(e) => setSelectedProgression(e.target.value)}
            aria-describedby="progression-description"
          >
            {Object.keys(availableProgressions).map(prog => (
              <option key={prog} value={prog}>{prog}</option>
            ))}
          </select>
          <span id="progression-description" className="sr-only">Select a chord progression pattern</span>
        </div>

        <div className="control-group">
          <label htmlFor="tempo-slider">
            Tempo (BPM):
          </label>
          <input 
            id="tempo-slider"
            type="range" 
            min="60" 
            max="180" 
            value={tempo} 
            onChange={(e) => setTempo(parseInt(e.target.value))}
            aria-valuemin="60"
            aria-valuemax="180"
            aria-valuenow={tempo}
            aria-describedby="tempo-value"
          />
          <span id="tempo-value">{tempo} BPM</span>
        </div>

        <div className="control-group">
          <label htmlFor="chord-duration-input">
            Chord Duration (bars):
          </label>
          <input 
            id="chord-duration-input"
            type="number" 
            min="0.5" 
            max="4" 
            step="0.5"
            value={chordDuration} 
            onChange={(e) => setChordDuration(parseFloat(e.target.value))}
            aria-describedby="duration-description"
          />
          <span id="duration-description" className="sr-only">Duration of each chord in bars</span>
        </div>

        {/* Advanced controls */}
        <fieldset className="advanced-controls">
          <legend>Advanced Options</legend>

          <div className="control-group">
            <label htmlFor="voice-leading-checkbox">
              Use Voice Leading:
            </label>
            <input 
              id="voice-leading-checkbox"
              type="checkbox" 
              checked={useVoiceLeading} 
              onChange={(e) => setUseVoiceLeading(e.target.checked)}
              aria-describedby="voice-leading-description"
            />
            <span id="voice-leading-description" className="sr-only">Enable smooth transitions between chords</span>
          </div>

          <div className="control-group">
            <label htmlFor="inversions-checkbox">
              Use Inversions:
            </label>
            <input 
              id="inversions-checkbox"
              type="checkbox" 
              checked={useInversions} 
              onChange={(e) => setUseInversions(e.target.checked)}
              aria-describedby="inversions-description"
            />
            <span id="inversions-description" className="sr-only">Enable chord inversions for different bass notes</span>
          </div>

          {useInversions && (
            <div className="control-group">
              <label htmlFor="inversion-select">
                Inversion:
              </label>
              <select 
                id="inversion-select"
                value={inversion} 
                onChange={(e) => setInversion(parseInt(e.target.value))}
                aria-describedby="inversion-type-description"
              >
                <option value="0">Root Position</option>
                <option value="1">First Inversion</option>
                <option value="2">Second Inversion</option>
                <option value="3">Third Inversion</option>
              </select>
              <span id="inversion-type-description" className="sr-only">Select which note of the chord is in the bass</span>
            </div>
          )}

          <div className="control-group">
            <label htmlFor="extended-chords-checkbox">
              Use Extended Chords:
            </label>
            <input 
              id="extended-chords-checkbox"
              type="checkbox" 
              checked={useExtendedChords} 
              onChange={(e) => setUseExtendedChords(e.target.checked)}
              aria-describedby="extended-chords-description"
            />
            <span id="extended-chords-description" className="sr-only">Enable 7th, 9th, and other extended chord types</span>
          </div>
        </fieldset>

        <fieldset className="sound-options">
          <legend>Sound Options</legend>

          <div className="control-group">
            <label htmlFor="sound-font-checkbox">
              Use Realistic Instrument Sounds:
            </label>
            <input 
              id="sound-font-checkbox"
              type="checkbox" 
              checked={useSoundFont} 
              onChange={(e) => setUseSoundFont(e.target.checked)}
              aria-describedby="sound-font-description"
            />
            <span id="sound-font-description" className="sr-only">Enable realistic instrument samples instead of synthesized sounds</span>
          </div>

          {useSoundFont && (
            <div className="control-group">
              <label htmlFor="instrument-select">
                Instrument:
              </label>
              <select 
                id="instrument-select"
                value={selectedInstrument} 
                onChange={(e) => {
                  setSelectedInstrument(e.target.value);
                  loadSoundFontInstrument(e.target.value);
                }}
                disabled={instrumentLoading}
                aria-describedby="instrument-description"
                aria-busy={instrumentLoading}
              >
                {Object.entries(availableInstruments).map(([value, name]) => (
                  <option key={value} value={value}>{name}</option>
                ))}
              </select>
              <span id="instrument-description" className="sr-only">Select the instrument for playback</span>
              {instrumentLoading && (
                <span className="loading-indicator" role="status" aria-live="polite">
                  Loading instrument...
                </span>
              )}
            </div>
          )}
        </fieldset>
      </form>

      <div className="actions">
        <button 
          onClick={generateProgression}
          aria-label="Generate a new chord progression with the selected parameters"
        >
          Generate Progression
        </button>
        <button 
          onClick={playProgression}
          aria-label={isPlaying ? "Stop playing the current progression" : "Play the generated chord progression"}
        >
          {isPlaying ? 'Stop Playing' : 'Play Progression'}
        </button>

        <div className="save-load-buttons">
          <button 
            className="save-button"
            onClick={saveChordProgression}
            disabled={!progression}
            aria-label="Save the current chord progression"
            aria-disabled={!progression}
          >
            Save Progression
          </button>
          <button 
            className="load-button"
            onClick={() => setShowSavedContent(true)}
            aria-label="Load a saved chord progression"
          >
            Load Progression
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={`export-status ${statusType}`} role="status" aria-live="polite">
          <span className="status-icon" aria-hidden="true">
            {statusType === 'success' && '✓'}
            {statusType === 'error' && '✗'}
            {statusType === 'warning' && '⚠'}
            {statusType === 'info' && 'ℹ'}
          </span>
          {saveStatus}
        </div>
      )}

      {progression && (
        <section className="progression-info" aria-label="Generated Chord Progression Information">
          <h3>Generated Chord Progression</h3>
          <dl>
            <div>
              <dt>Key:</dt>
              <dd>{progression.key}</dd>
            </div>
          </dl>
          <div className="chord-list" role="list" aria-label="Chord sequence">
            {progression.progression.map((chord, index) => (
              <div key={index} className="chord" role="listitem">
                <strong>{chord.symbol || `${chord.root.slice(0, -1)}${chord.type}`}</strong>
                <span className="chord-degree">{chord.degree}</span>
                <span className="chord-notes">{chord.notes.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <>
          <div className="overlay" onClick={() => setShowSaveDialog(false)}></div>
          <div className="save-dialog" role="dialog" aria-labelledby="save-dialog-title">
            <h3 id="save-dialog-title">Save Chord Progression</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter a name for your chord progression"
              aria-label="Chord progression name"
              autoFocus
            />
            <div className="save-dialog-buttons">
              <button 
                className="save-button"
                onClick={handleSaveConfirm}
                aria-label="Confirm save"
              >
                Save
              </button>
              <button 
                onClick={() => setShowSaveDialog(false)}
                aria-label="Cancel save"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Saved Content Panel - Lazy loaded with Suspense */}
      {showSavedContent && (
        <>
          <div className="overlay" onClick={() => setShowSavedContent(false)}></div>
          <Suspense fallback={
            <div className="loading-message">
              Loading saved chord progressions...
            </div>
          }>
            <SavedContent 
              contentType="chord"
              onLoad={handleLoadChordProgression}
              onClose={() => setShowSavedContent(false)}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}

export default ChordGenerator;
