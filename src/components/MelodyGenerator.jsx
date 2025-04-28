import { useState } from 'react';
import * as Tone from 'tone';

// Import utility functions
import { defaultScales } from '../utils/scales';
import { rhythmPatterns, contourTypes, generateMotif, applyMotifVariation } from '../utils/patterns';
import { humanizeNotes, applyArticulation, applyDynamics } from '../utils/humanize';

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

  // Initialize Tone.js synth
  const synth = new Tone.PolySynth(Tone.Synth).toDestination();

  // Generate a melody based on the selected parameters
  const generateMelody = () => {
    const scale = scales[selectedScale];
    let notes = [];
    let currentTime = 0;

    // Get the selected rhythm pattern
    const selectedPattern = rhythmPatterns[rhythmPattern] || rhythmPatterns.basic;

    // Get the selected contour function
    const contourFn = contourTypes[contourType] || contourTypes.random;

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

  // Play the generated melody
  const playMelody = async () => {
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
  };

  return (
    <div className="melody-generator">
      <h2>Melody Generator</h2>

      <div className="controls">
        <div className="control-group">
          <label>
            Scale:
            <select 
              value={selectedScale} 
              onChange={(e) => setSelectedScale(e.target.value)}
            >
              {Object.keys(scales).map(scale => (
                <option key={scale} value={scale}>{scale}</option>
              ))}
            </select>
          </label>/
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
            Bars:
            <input 
              type="number" 
              min="1" 
              max="16" 
              value={bars} 
              onChange={(e) => setBars(parseInt(e.target.value))}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            Complexity:
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={complexity} 
              onChange={(e) => setComplexity(parseInt(e.target.value))}
            />
            <span>{complexity}</span>
          </label>
        </div>

        {/* Advanced controls */}
        <div className="advanced-controls">
          <h3>Advanced Options</h3>

          <div className="control-group">
            <label>
              Rhythm Pattern:
              <select 
                value={rhythmPattern} 
                onChange={(e) => setRhythmPattern(e.target.value)}
              >
                {Object.keys(rhythmPatterns).map(pattern => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="control-group">
            <label>
              Melodic Contour:
              <select 
                value={contourType} 
                onChange={(e) => setContourType(e.target.value)}
              >
                {Object.keys(contourTypes).map(contour => (
                  <option key={contour} value={contour}>{contour}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="control-group">
            <label>
              Use Motif:
              <input 
                type="checkbox" 
                checked={useMotif} 
                onChange={(e) => setUseMotif(e.target.checked)}
              />
            </label>
          </div>

          {useMotif && (
            <div className="control-group">
              <label>
                Motif Variation:
                <select 
                  value={motifVariation} 
                  onChange={(e) => setMotifVariation(e.target.value)}
                >
                  <option value="transpose">Transpose</option>
                  <option value="invert">Invert</option>
                  <option value="retrograde">Retrograde</option>
                  <option value="augment">Augment</option>
                  <option value="diminish">Diminish</option>
                </select>
              </label>
            </div>
          )}

          <div className="control-group">
            <label>
              Articulation:
              <select 
                value={articulation} 
                onChange={(e) => setArticulation(e.target.value)}
              >
                <option value="none">None</option>
                <option value="legato">Legato</option>
                <option value="staccato">Staccato</option>
                <option value="marcato">Marcato</option>
                <option value="tenuto">Tenuto</option>
              </select>
            </label>
          </div>

          <div className="control-group">
            <label>
              Dynamics:
              <select 
                value={dynamics} 
                onChange={(e) => setDynamics(e.target.value)}
              >
                <option value="none">None</option>
                <option value="crescendo">Crescendo</option>
                <option value="diminuendo">Diminuendo</option>
                <option value="swell">Swell</option>
                <option value="fade">Fade</option>
                <option value="accent">Accent</option>
              </select>
            </label>
          </div>

          <div className="control-group">
            <label>
              Humanize:
              <input 
                type="checkbox" 
                checked={humanize} 
                onChange={(e) => setHumanize(e.target.checked)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="actions">
        <button onClick={generateMelody}>Generate Melody</button>
        <button onClick={playMelody}>
          {isPlaying ? 'Stop Playing' : 'Play Melody'}
        </button>
      </div>

      {melody && (
        <div className="melody-info">
          <h3>Generated Melody</h3>
          <p>Scale: {melody.scale}</p>
          <p>Tempo: {melody.tempo} BPM</p>
          <p>Length: {melody.length} bars</p>
          <p>Notes: {melody.notes.length}</p>
          <p>Rhythm Pattern: {melody.rhythmPattern}</p>
          <p>Contour: {melody.contourType}</p>
          {melody.useMotif && <p>Motif Variation: {melody.motifVariation}</p>}
          {melody.articulation !== 'none' && <p>Articulation: {melody.articulation}</p>}
          {melody.dynamics !== 'none' && <p>Dynamics: {melody.dynamics}</p>}
          <p>Humanized: {melody.humanize ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}

export default MelodyGenerator;
