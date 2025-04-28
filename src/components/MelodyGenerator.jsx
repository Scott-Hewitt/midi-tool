import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import * as Tone from 'tone';

// Import utility functions
import { defaultScales } from '../utils/scales';
import { rhythmPatterns, contourTypes, generateMotif, applyMotifVariation } from '../utils/patterns';
import { humanizeNotes, applyArticulation, applyDynamics } from '../utils/humanize';
import { saveToLocalStorage, generateStorageKey, isLocalStorageAvailable } from '../utils/storageUtils';

// Lazy load components for better performance
const SavedContent = lazy(() => import('./SavedContent'));

// Use the default scales from the scales utility
const scales = defaultScales;

function MelodyGenerator({ onMelodyGenerated }) {
  const [selectedScale, setSelectedScale] = useState('C Major');
  const [tempo, setTempo] = useState(120);
  const [bars, setBars] = useState(4);
  const [complexity, setComplexity] = useState(5);
  const [melody, setMelody] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // New state variables for advanced features
  const [rhythmPattern, setRhythmPattern] = useState('basic');
  const [contourType, setContourType] = useState('random');
  const [useMotif, setUseMotif] = useState(false);
  const [motifVariation, setMotifVariation] = useState('transpose');
  const [articulation, setArticulation] = useState('legato');
  const [dynamics, setDynamics] = useState('none');
  const [humanize, setHumanize] = useState(true);

  // State variables for save/load functionality
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedContent, setShowSavedContent] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info', 'success', 'error', 'warning'

  // Initialize Tone.js synth
  const synth = new Tone.PolySynth(Tone.Synth).toDestination();

  /**
   * Memoized scales object to prevent unnecessary recalculations
   */
  const memoizedScales = useMemo(() => scales, []);

  /**
   * Memoized function to get the selected rhythm pattern
   * This prevents unnecessary recalculations when other state changes
   */
  const getSelectedPattern = useCallback(() => {
    return rhythmPatterns[rhythmPattern] || rhythmPatterns.basic;
  }, [rhythmPattern]);

  /**
   * Memoized function to get the selected contour function
   * This prevents unnecessary recalculations when other state changes
   */
  const getContourFunction = useCallback(() => {
    return contourTypes[contourType] || contourTypes.random;
  }, [contourType]);

  /**
   * Generate a melody based on the selected parameters
   * Uses memoized functions for better performance
   * @returns {Array} Array of note objects
   */
  const generateMelody = () => {
    const scale = memoizedScales[selectedScale];
    let notes = [];
    let currentTime = 0;

    // Get the selected rhythm pattern using memoized function
    const selectedPattern = getSelectedPattern();

    // Get the selected contour function using memoized function
    const contourFn = getContourFunction();

    // Generate a motif if enabled
    const motif = useMotif ? generateMotif(scale, 4) : null;

    // Calculate total notes based on rhythm pattern and bars
    const patternTotalDuration = selectedPattern.reduce((sum, duration) => sum + duration, 0);
    const patternsPerBar = 4 / patternTotalDuration; // Assuming 4/4 time
    const totalPatterns = Math.ceil(bars * patternsPerBar);

    // Generate notes based on whether we're using motifs or not
    if (useMotif && motif) {
      // Generate melody using motifs
      for (let bar = 0; bar < bars; bar++) {
        // Decide whether to use the motif directly or with variation
        const useVariation = bar % 2 === 1 || (bar > 0 && Math.random() < 0.3);
        const currentMotif = useVariation 
          ? applyMotifVariation(motif, scale.length, motifVariation)
          : motif;

        // Add the motif notes to the melody
        currentMotif.forEach(motifNote => {
          const scaleIndex = Math.min(scale.length - 1, Math.max(0, motifNote.scaleIndex));
          notes.push({
            pitch: scale[scaleIndex],
            duration: motifNote.duration,
            velocity: 0.7 + (Math.random() * 0.3),
            startTime: currentTime
          });
          currentTime += motifNote.duration;
        });
      }
    } else {
      // Generate melody using rhythm patterns and contour
      let patternIndex = 0;

      for (let i = 0; i < totalPatterns; i++) {
        for (let j = 0; j < selectedPattern.length; j++) {
          // Get duration from pattern
          const duration = selectedPattern[j];

          // Use contour to influence note selection
          const contourPosition = contourFn(patternIndex / (totalPatterns * selectedPattern.length));

          // Calculate scale position based on contour and complexity
          const scalePosition = Math.floor(
            contourPosition * scale.length + 
            (Math.random() * complexity / 5 - complexity / 10)
          );

          // Clamp to valid scale indices
          const clampedPosition = Math.min(scale.length - 1, Math.max(0, scalePosition));
          const note = scale[clampedPosition];

          // Velocity (0-127 in MIDI, but normalized to 0-1 for Tone.js)
          const velocity = 0.7 + (Math.random() * 0.3); // Between 0.7 and 1.0

          notes.push({
            pitch: note,
            duration: duration,
            velocity: velocity,
            startTime: currentTime
          });

          currentTime += duration;
          patternIndex++;
        }
      }
    }

    // Trim notes to fit within the specified number of bars
    const totalDuration = bars * 4; // 4 beats per bar
    notes = notes.filter(note => note.startTime < totalDuration);

    // Apply articulation if selected
    if (articulation !== 'none') {
      notes = applyArticulation(notes, articulation);
    }

    // Apply dynamics if selected
    if (dynamics !== 'none') {
      notes = applyDynamics(notes, dynamics);
    }

    // Apply humanization if enabled
    if (humanize) {
      notes = humanizeNotes(notes, {
        timingVariation: 0.02,
        velocityVariation: 0.1,
        durationVariation: 0.05
      });
    }

    const melodyData = {
      scale: selectedScale,
      tempo: tempo,
      length: bars,
      complexity: complexity,
      rhythmPattern: rhythmPattern,
      contourType: contourType,
      useMotif: useMotif,
      motifVariation: motifVariation,
      articulation: articulation,
      dynamics: dynamics,
      humanize: humanize,
      notes: notes
    };

    setMelody(melodyData);

    // Call the callback function if provided
    if (onMelodyGenerated) {
      onMelodyGenerated(melodyData);
    }

    return notes;
  };

  /**
   * Play the generated melody
   * Memoized to prevent unnecessary re-creation when other state changes
   */
  const playMelody = useCallback(async () => {
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setIsPlaying(false);
      return;
    }

    // Generate melody if not already generated
    const notes = melody ? melody.notes : generateMelody();

    // Set the tempo
    Tone.Transport.bpm.value = tempo;

    // Schedule the notes
    const now = Tone.now();
    notes.forEach(note => {
      // Convert duration from beats to seconds
      const durationSeconds = note.duration * 60 / tempo;

      // Schedule the note at its start time
      const startTime = now + (note.startTime * 60 / tempo);

      synth.triggerAttackRelease(
        note.pitch,
        durationSeconds,
        startTime,
        note.velocity
      );
    });

    setIsPlaying(true);

    // Calculate total duration of the melody
    const totalDuration = notes.reduce(
      (max, note) => Math.max(max, note.startTime + note.duration),
      0
    );

    // Stop playing after the melody is complete
    setTimeout(() => {
      setIsPlaying(false);
    }, (totalDuration * 60 / tempo * 1000) + 500); // Add a small buffer
  }, [isPlaying, melody, tempo, synth, generateMelody]);

  /**
   * Clear save status message after a delay
   * Memoized to prevent unnecessary re-creation when other state changes
   * @param {number} delay - Delay in milliseconds before clearing the status
   */
  const clearSaveStatus = useCallback((delay = 3000) => {
    setTimeout(() => {
      setSaveStatus('');
      setStatusType('info');
    }, delay);
  }, []);

  /**
   * Save the current melody to local storage
   * Memoized to prevent unnecessary re-creation when other state changes
   */
  const saveMelody = useCallback(() => {
    if (!melody) {
      setSaveStatus('No melody to save. Please generate a melody first.');
      setStatusType('warning');
      clearSaveStatus();
      return;
    }

    // Check if local storage is available
    if (!isLocalStorageAvailable()) {
      setSaveStatus('Local storage is not available in your browser. Unable to save melody.');
      setStatusType('error');
      clearSaveStatus();
      return;
    }

    // Show the save dialog
    setShowSaveDialog(true);
  }, [melody, clearSaveStatus]);

  /**
   * Handle the actual saving after name is entered
   * Memoized to prevent unnecessary re-creation when other state changes
   */
  const handleSaveConfirm = useCallback(() => {
    if (!saveName.trim()) {
      setSaveStatus('Please enter a name for your melody.');
      setStatusType('warning');
      return;
    }

    try {
      // Generate a unique key for this melody
      const key = generateStorageKey('melody', saveName);

      // Save the melody to local storage
      const success = saveToLocalStorage(key, melody);

      if (success) {
        setSaveStatus(`Melody "${saveName}" saved successfully!`);
        setStatusType('success');
        // Close the save dialog
        setShowSaveDialog(false);
        // Reset the save name
        setSaveName('');
      } else {
        setSaveStatus('Failed to save melody. Please try again.');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error saving melody:', error);
      setSaveStatus(`Error saving melody: ${error.message}`);
      setStatusType('error');
    }

    clearSaveStatus();
  }, [saveName, melody, clearSaveStatus, setSaveName, setShowSaveDialog]);

  /**
   * Handle loading a melody from SavedContent
   * Memoized to prevent unnecessary re-creation when other state changes
   * @param {Object} loadedMelody - The melody data to load
   */
  const handleLoadMelody = useCallback((loadedMelody) => {
    if (!loadedMelody) {
      setSaveStatus('Failed to load melody. The data may be corrupted.');
      setStatusType('error');
      clearSaveStatus();
      return;
    }

    try {
      // Update all state variables with the loaded melody data
      setSelectedScale(loadedMelody.scale || 'C Major');
      setTempo(loadedMelody.tempo || 120);
      setBars(loadedMelody.length || 4);
      setComplexity(loadedMelody.complexity || 5);
      setRhythmPattern(loadedMelody.rhythmPattern || 'basic');
      setContourType(loadedMelody.contourType || 'random');
      setUseMotif(loadedMelody.useMotif || false);
      setMotifVariation(loadedMelody.motifVariation || 'transpose');
      setArticulation(loadedMelody.articulation || 'legato');
      setDynamics(loadedMelody.dynamics || 'none');
      setHumanize(loadedMelody.humanize !== undefined ? loadedMelody.humanize : true);

      // Set the melody
      setMelody(loadedMelody);

      // Close the saved content panel
      setShowSavedContent(false);

      // Show success message
      setSaveStatus('Melody loaded successfully!');
      setStatusType('success');

      // Call the callback function if provided
      if (onMelodyGenerated) {
        onMelodyGenerated(loadedMelody);
      }
    } catch (error) {
      console.error('Error loading melody:', error);
      setSaveStatus(`Error loading melody: ${error.message}`);
      setStatusType('error');
    }

    clearSaveStatus();
  }, [
    clearSaveStatus, 
    onMelodyGenerated, 
    setArticulation, 
    setBars, 
    setComplexity, 
    setContourType, 
    setDynamics, 
    setHumanize, 
    setMelody, 
    setMotifVariation, 
    setRhythmPattern, 
    setSelectedScale, 
    setShowSavedContent, 
    setTempo, 
    setUseMotif
  ]);

  return (
    <div className="melody-generator" role="region" aria-label="Melody Generator">
      <h2 id="melody-generator-title">Melody Generator</h2>

      <form className="controls" onSubmit={(e) => e.preventDefault()} aria-labelledby="melody-generator-title">
        <div className="control-group">
          <label htmlFor="scale-select">
            Scale:
          </label>
          <select 
            id="scale-select"
            value={selectedScale} 
            onChange={(e) => setSelectedScale(e.target.value)}
            aria-describedby="scale-description"
          >
            {Object.keys(scales).map(scale => (
              <option key={scale} value={scale}>{scale}</option>
            ))}
          </select>
          <span id="scale-description" className="sr-only">Select the musical scale for your melody</span>
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
          <label htmlFor="bars-input">
            Bars:
          </label>
          <input 
            id="bars-input"
            type="number" 
            min="1" 
            max="16" 
            value={bars} 
            onChange={(e) => setBars(parseInt(e.target.value))}
            aria-describedby="bars-description"
          />
          <span id="bars-description" className="sr-only">Number of bars in the melody</span>
        </div>

        <div className="control-group">
          <label htmlFor="complexity-slider">
            Complexity:
          </label>
          <input 
            id="complexity-slider"
            type="range" 
            min="1" 
            max="10" 
            value={complexity} 
            onChange={(e) => setComplexity(parseInt(e.target.value))}
            aria-valuemin="1"
            aria-valuemax="10"
            aria-valuenow={complexity}
            aria-describedby="complexity-value"
          />
          <span id="complexity-value">{complexity}</span>
        </div>

        {/* Advanced controls */}
        <fieldset className="advanced-controls">
          <legend>Advanced Options</legend>

          <div className="control-group">
            <label htmlFor="rhythm-pattern-select">
              Rhythm Pattern:
            </label>
            <select 
              id="rhythm-pattern-select"
              value={rhythmPattern} 
              onChange={(e) => setRhythmPattern(e.target.value)}
              aria-describedby="rhythm-description"
            >
              {Object.keys(rhythmPatterns).map(pattern => (
                <option key={pattern} value={pattern}>{pattern}</option>
              ))}
            </select>
            <span id="rhythm-description" className="sr-only">Select the rhythm pattern for your melody</span>
          </div>

          <div className="control-group">
            <label htmlFor="contour-select">
              Melodic Contour:
            </label>
            <select 
              id="contour-select"
              value={contourType} 
              onChange={(e) => setContourType(e.target.value)}
              aria-describedby="contour-description"
            >
              {Object.keys(contourTypes).map(contour => (
                <option key={contour} value={contour}>{contour}</option>
              ))}
            </select>
            <span id="contour-description" className="sr-only">Select the melodic contour pattern</span>
          </div>

          <div className="control-group">
            <label htmlFor="use-motif-checkbox">
              Use Motif:
            </label>
            <input 
              id="use-motif-checkbox"
              type="checkbox" 
              checked={useMotif} 
              onChange={(e) => setUseMotif(e.target.checked)}
              aria-describedby="motif-description"
            />
            <span id="motif-description" className="sr-only">Enable to use a recurring musical motif</span>
          </div>

          {useMotif && (
            <div className="control-group">
              <label htmlFor="motif-variation-select">
                Motif Variation:
              </label>
              <select 
                id="motif-variation-select"
                value={motifVariation} 
                onChange={(e) => setMotifVariation(e.target.value)}
                aria-describedby="variation-description"
              >
                <option value="transpose">Transpose</option>
                <option value="invert">Invert</option>
                <option value="retrograde">Retrograde</option>
                <option value="augment">Augment</option>
                <option value="diminish">Diminish</option>
              </select>
              <span id="variation-description" className="sr-only">Select how the motif will vary throughout the melody</span>
            </div>
          )}

          <div className="control-group">
            <label htmlFor="articulation-select">
              Articulation:
            </label>
            <select 
              id="articulation-select"
              value={articulation} 
              onChange={(e) => setArticulation(e.target.value)}
              aria-describedby="articulation-description"
            >
              <option value="none">None</option>
              <option value="legato">Legato</option>
              <option value="staccato">Staccato</option>
              <option value="marcato">Marcato</option>
              <option value="tenuto">Tenuto</option>
            </select>
            <span id="articulation-description" className="sr-only">Select the articulation style for notes</span>
          </div>

          <div className="control-group">
            <label htmlFor="dynamics-select">
              Dynamics:
            </label>
            <select 
              id="dynamics-select"
              value={dynamics} 
              onChange={(e) => setDynamics(e.target.value)}
              aria-describedby="dynamics-description"
            >
              <option value="none">None</option>
              <option value="crescendo">Crescendo</option>
              <option value="diminuendo">Diminuendo</option>
              <option value="swell">Swell</option>
              <option value="fade">Fade</option>
              <option value="accent">Accent</option>
            </select>
            <span id="dynamics-description" className="sr-only">Select the dynamic expression for the melody</span>
          </div>

          <div className="control-group">
            <label htmlFor="humanize-checkbox">
              Humanize:
            </label>
            <input 
              id="humanize-checkbox"
              type="checkbox" 
              checked={humanize} 
              onChange={(e) => setHumanize(e.target.checked)}
              aria-describedby="humanize-description"
            />
            <span id="humanize-description" className="sr-only">Add subtle variations to timing and velocity for a more natural sound</span>
          </div>
        </fieldset>
      </form>

      <div className="actions">
        <button 
          onClick={generateMelody}
          aria-label="Generate a new melody with the selected parameters"
        >
          Generate Melody
        </button>
        <button 
          onClick={playMelody}
          aria-label={isPlaying ? "Stop playing the current melody" : "Play the generated melody"}
        >
          {isPlaying ? 'Stop Playing' : 'Play Melody'}
        </button>

        <div className="save-load-buttons">
          <button 
            className="save-button"
            onClick={saveMelody}
            disabled={!melody}
            aria-label="Save the current melody"
            aria-disabled={!melody}
          >
            Save Melody
          </button>
          <button 
            className="load-button"
            onClick={() => setShowSavedContent(true)}
            aria-label="Load a saved melody"
          >
            Load Melody
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

      {melody && (
        <section className="melody-info" aria-label="Generated Melody Information">
          <h3>Generated Melody</h3>
          <dl>
            <div>
              <dt>Scale:</dt>
              <dd>{melody.scale}</dd>
            </div>
            <div>
              <dt>Tempo:</dt>
              <dd>{melody.tempo} BPM</dd>
            </div>
            <div>
              <dt>Length:</dt>
              <dd>{melody.length} bars</dd>
            </div>
            <div>
              <dt>Notes:</dt>
              <dd>{melody.notes.length}</dd>
            </div>
            <div>
              <dt>Rhythm Pattern:</dt>
              <dd>{melody.rhythmPattern}</dd>
            </div>
            <div>
              <dt>Contour:</dt>
              <dd>{melody.contourType}</dd>
            </div>
            {melody.useMotif && (
              <div>
                <dt>Motif Variation:</dt>
                <dd>{melody.motifVariation}</dd>
              </div>
            )}
            {melody.articulation !== 'none' && (
              <div>
                <dt>Articulation:</dt>
                <dd>{melody.articulation}</dd>
              </div>
            )}
            {melody.dynamics !== 'none' && (
              <div>
                <dt>Dynamics:</dt>
                <dd>{melody.dynamics}</dd>
              </div>
            )}
            <div>
              <dt>Humanized:</dt>
              <dd>{melody.humanize ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </section>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <>
          <div className="overlay" onClick={() => setShowSaveDialog(false)}></div>
          <div className="save-dialog" role="dialog" aria-labelledby="save-dialog-title">
            <h3 id="save-dialog-title">Save Melody</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter a name for your melody"
              aria-label="Melody name"
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
              Loading saved melodies...
            </div>
          }>
            <SavedContent 
              contentType="melody"
              onLoad={handleLoadMelody}
              onClose={() => setShowSavedContent(false)}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}

export default MelodyGenerator;
