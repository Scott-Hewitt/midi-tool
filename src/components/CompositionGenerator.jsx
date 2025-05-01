import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { initializeTone, createSynth } from '../utils/toneContext';
import { ensureAudioContext, getAudioContext } from '../utils/audioContext';
import {
  Box,
  Heading,
  SimpleGrid,
  FormControl,
  FormLabel,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Button,
  HStack,
  VStack,
  Text,
  Divider,
  Flex,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  Spinner,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { AccordionButton } from '@chakra-ui/react';

import { defaultScales } from '../utils/scales';
import {
  rhythmPatterns,
  contourTypes,
  generateMotif,
  applyMotifVariation,
  // generateArpeggios is not currently used
} from '../utils/patterns';
import { humanizeNotes, applyArticulation, applyDynamics } from '../utils/humanize';
import {
  // getKeys is not currently used
  getCommonProgressions,
  generateChordProgression,
  // getChordNotes is not currently used
} from '../utils/tonalUtils';
import { applyVoiceLeading, noteToMidi, midiToNote } from '../utils/chords';

// SoundFont utilities are now managed in the Composition Studio

// Use the default scales from the scales utility
const scales = defaultScales;

const keyOptions = [
  'C major',
  'C# major',
  'D major',
  'Eb major',
  'E major',
  'F major',
  'F# major',
  'G major',
  'Ab major',
  'A major',
  'Bb major',
  'B major',
  'A minor',
  'Bb minor',
  'B minor',
  'C minor',
  'C# minor',
  'D minor',
  'Eb minor',
  'E minor',
  'F minor',
  'F# minor',
  'G minor',
  'G# minor',
];

function CompositionGenerator({ onCompositionGenerated }) {
  const [selectedKey, setSelectedKey] = useState('C major');
  const [tempo, setTempo] = useState(120);
  const [bars, setBars] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [composition, setComposition] = useState(null);
  // activePlayingPart is no longer used as playback is handled by PlaybackContext
  const [, setActivePlayingPart] = useState(null);

  const [useVerseChorus, setUseVerseChorus] = useState(false);
  const [verseProgression, setVerseProgression] = useState('Pop I-V-vi-IV');
  const [chorusProgression, setChorusProgression] = useState('Basic I-IV-V-I');
  const [structure, setStructure] = useState('verse-chorus-verse-chorus');

  const [complexity, setComplexity] = useState(5);
  const [rhythmPattern, setRhythmPattern] = useState('basic');
  const [contourType, setContourType] = useState('random');
  const [useMotif, setUseMotif] = useState(false);
  const [motifVariation, setMotifVariation] = useState('transpose');
  const [melodyArticulation, setMelodyArticulation] = useState('legato');
  const [melodyDynamics, setMelodyDynamics] = useState('none');
  const [humanize, setHumanize] = useState(true);

  const [selectedProgression, setSelectedProgression] = useState('Basic I-IV-V-I');
  const [chordDuration, setChordDuration] = useState(1);
  const [useVoiceLeading, setUseVoiceLeading] = useState(false);
  const [useInversions, setUseInversions] = useState(false);
  const [inversion, setInversion] = useState(0);
  const [useExtendedChords, setUseExtendedChords] = useState(false);
  const [autoRandomize, setAutoRandomize] = useState(true);

  const [bassPattern, setBassPattern] = useState('basic');
  const [bassOctave, setBassOctave] = useState(2);
  const [bassComplexity, setBassComplexity] = useState(3);

  const [availableProgressions, setAvailableProgressions] = useState({});

  const audioContextRef = useRef(null);

  const melodySynthRef = useRef(null);
  const chordSynthRef = useRef(null);
  const bassSynthRef = useRef(null);

  useEffect(() => {
    setAvailableProgressions(getCommonProgressions());

    const currentAudioContext = getAudioContext();
    if (currentAudioContext) {
      audioContextRef.current = currentAudioContext;
    }
  }, []);

  const randomizeOptions = () => {
    const rhythmPatternKeys = Object.keys(rhythmPatterns);
    setRhythmPattern(rhythmPatternKeys[Math.floor(Math.random() * rhythmPatternKeys.length)]);

    const contourTypeKeys = Object.keys(contourTypes);
    setContourType(contourTypeKeys[Math.floor(Math.random() * contourTypeKeys.length)]);

    const shouldUseMotif = Math.random() > 0.5;
    setUseMotif(shouldUseMotif);

    if (shouldUseMotif) {
      const motifVariations = ['transpose', 'invert', 'retrograde', 'rhythmic'];
      setMotifVariation(motifVariations[Math.floor(Math.random() * motifVariations.length)]);
    }

    const articulations = ['legato', 'staccato', 'accent', 'none'];
    setMelodyArticulation(articulations[Math.floor(Math.random() * articulations.length)]);

    const dynamicsOptions = ['crescendo', 'diminuendo', 'random', 'none'];
    setMelodyDynamics(dynamicsOptions[Math.floor(Math.random() * dynamicsOptions.length)]);

    setHumanize(Math.random() > 0.3);

    setUseExtendedChords(Math.random() > 0.5);

    setUseVoiceLeading(Math.random() > 0.6);

    const shouldUseInversions = Math.random() > 0.7;
    setUseInversions(shouldUseInversions);

    if (shouldUseInversions) {
      setInversion(Math.floor(Math.random() * 3));
    }

    const bassPatterns = ['basic', 'walking', 'arpeggiated', 'octaves'];
    setBassPattern(bassPatterns[Math.floor(Math.random() * bassPatterns.length)]);

    setBassComplexity(Math.floor(Math.random() * 5) + 1);
  };

  const generateComposition = async () => {
    if (autoRandomize) {
      randomizeOptions();
    }

    // Generate chord progression
    let formattedChords = [];

    if (useVerseChorus) {
      // Parse the structure
      const sections = structure.split('-');
      let currentPosition = 0;

      // Generate chords for each section
      sections.forEach(section => {
        let sectionChords;
        let sectionProgression;

        // Determine which progression to use based on the section type
        if (section.toLowerCase() === 'verse') {
          sectionProgression = availableProgressions[verseProgression] || ['I', 'V', 'vi', 'IV'];
        } else if (section.toLowerCase() === 'chorus') {
          sectionProgression = availableProgressions[chorusProgression] || ['I', 'IV', 'V', 'I'];
        } else if (section.toLowerCase() === 'intro') {
          // For intro, use a simpler version of the verse progression
          sectionProgression = availableProgressions[verseProgression]?.slice(0, 2) || ['I', 'V'];
        } else if (section.toLowerCase() === 'outro') {
          // For outro, use a simpler version of the chorus progression
          sectionProgression = availableProgressions[chorusProgression]?.slice(-2) || ['V', 'I'];
        } else {
          // Default to the selected progression
          sectionProgression = availableProgressions[selectedProgression] || ['I', 'IV', 'V', 'I'];
        }

        // Generate chords for this section
        sectionChords = generateChordProgression(
          selectedKey,
          sectionProgression,
          useExtendedChords
        );

        // Format the chords and add them to the overall progression
        sectionChords.forEach((chord, index) => {
          formattedChords.push({
            root: chord.root,
            type: chord.type,
            notes: chord.notes,
            duration: chordDuration,
            position: currentPosition + index * chordDuration,
            symbol: chord.symbol,
            degree: chord.degree,
            section: section.toLowerCase(), // Add section information
          });
        });

        // Update the current position
        currentPosition += sectionChords.length * chordDuration;
      });

      // Apply voice leading to the entire progression if enabled
      if (useVoiceLeading) {
        formattedChords = applyVoiceLeading(formattedChords);
      }
    } else {
      // Standard progression without verse/chorus structure
      // Get the progression pattern from available progressions
      const progressionPattern = availableProgressions[selectedProgression] || [
        'I',
        'IV',
        'V',
        'I',
      ];
      const chords = generateChordProgression(selectedKey, progressionPattern, useExtendedChords);

      // Format the chords
      formattedChords = chords.map((chord, index) => ({
        root: chord.root,
        type: chord.type,
        notes: chord.notes,
        duration: chordDuration,
        position: index * chordDuration,
        symbol: chord.symbol,
        degree: chord.degree,
      }));

      // Apply voice leading if enabled
      if (useVoiceLeading) {
        formattedChords = applyVoiceLeading(formattedChords);
      }
    }

    // Generate melody
    const scale = scales[selectedKey] || scales['C Major']; // Fallback to C Major if the selected key is not found
    let melodyNotes = [];
    let currentTime = 0;

    if (scale && scale.length > 0) {
      if (useVerseChorus) {
        // Generate melody for each section based on the chord progression
        // We track section changes to apply different motifs and patterns
        let currentSection = '';
        let sectionMotif = null;

        // Process each chord to generate melody notes
        formattedChords.forEach((chord, chordIndex) => {
          // Check if we're starting a new section
          if (chord.section !== currentSection) {
            currentSection = chord.section;

            // Generate a new motif for this section if using motifs
            if (useMotif) {
              sectionMotif = generateMotif(scale, 4);
            }

            // New section detected - position is tracked in chord.position
          }

          // Determine rhythm pattern and contour based on section
          let sectionRhythmPattern;
          let sectionContourFn;

          if (currentSection === 'verse') {
            // Verses often have more varied rhythms
            sectionRhythmPattern = rhythmPatterns[rhythmPattern] || rhythmPatterns.basic;
            sectionContourFn = contourTypes['arch'] || contourTypes.random;
          } else if (currentSection === 'chorus') {
            // Choruses often have more repetitive, memorable rhythms
            sectionRhythmPattern = rhythmPatterns['basic'] || rhythmPatterns.basic;
            sectionContourFn = contourTypes['wave'] || contourTypes.random;
          } else if (currentSection === 'intro') {
            // Intros often build up
            sectionRhythmPattern = rhythmPatterns['dotted'] || rhythmPatterns.basic;
            sectionContourFn = contourTypes['ascending'] || contourTypes.random;
          } else if (currentSection === 'outro') {
            // Outros often wind down
            sectionRhythmPattern = rhythmPatterns['dotted'] || rhythmPatterns.basic;
            sectionContourFn = contourTypes['descending'] || contourTypes.random;
          } else {
            // Default
            sectionRhythmPattern = rhythmPatterns[rhythmPattern] || rhythmPatterns.basic;
            sectionContourFn = contourTypes[contourType] || contourTypes.random;
          }

          // Calculate chord duration in beats
          const chordDurationBeats = chord.duration * 4;

          // Generate melody for this chord
          if (useMotif && sectionMotif) {
            // Use motif-based melody generation
            const useVariation = chordIndex % 2 === 1 || (chordIndex > 0 && Math.random() < 0.3);
            const currentMotif = useVariation
              ? applyMotifVariation(sectionMotif, scale.length, motifVariation)
              : sectionMotif;

            // Scale the motif to fit the chord duration
            const motifTotalDuration = currentMotif.reduce((sum, note) => sum + note.duration, 0);
            const scaleFactor = chordDurationBeats / motifTotalDuration;

            let chordTime = chord.position * 4; // Convert from bars to beats

            // Add the motif notes to the melody
            currentMotif.forEach(motifNote => {
              const scaleIndex = Math.min(scale.length - 1, Math.max(0, motifNote.scaleIndex));

              // Adjust note to fit chord (prefer chord tones)
              let adjustedScaleIndex = scaleIndex;
              if (chord.notes && chord.notes.length > 0 && Math.random() < 0.7) {
                // Extract note names from chord notes (without octave)
                const chordNoteNames = chord.notes.map(note => note.slice(0, -1));

                // Find the closest chord tone
                const scaleNoteName = scale[scaleIndex].slice(0, -1);
                if (!chordNoteNames.includes(scaleNoteName)) {
                  // Find a chord tone to use instead
                  const randomChordNote =
                    chordNoteNames[Math.floor(Math.random() * chordNoteNames.length)];
                  // Find this note in the scale
                  const newIndex = scale.findIndex(note => note.slice(0, -1) === randomChordNote);
                  if (newIndex !== -1) {
                    adjustedScaleIndex = newIndex;
                  }
                }
              }

              melodyNotes.push({
                pitch: scale[adjustedScaleIndex],
                duration: motifNote.duration * scaleFactor,
                velocity: 0.7 + Math.random() * 0.3,
                startTime: chordTime,
                section: currentSection,
              });

              chordTime += motifNote.duration * scaleFactor;
            });
          } else {
            // Use pattern-based melody generation
            const patternTotalDuration = sectionRhythmPattern.reduce(
              (sum, duration) => sum + duration,
              0
            );
            const repetitions = Math.ceil(chordDurationBeats / patternTotalDuration);

            let chordTime = chord.position * 4; // Convert from bars to beats
            let patternIndex = 0;

            // Generate notes to fill the chord duration
            for (let rep = 0; rep < repetitions; rep++) {
              for (let j = 0; j < sectionRhythmPattern.length; j++) {
                // Check if we've exceeded the chord duration
                if (chordTime >= chord.position * 4 + chordDurationBeats) break;

                // Get duration from pattern
                const duration = sectionRhythmPattern[j];

                // Use contour to influence note selection
                const contourPosition = sectionContourFn(
                  patternIndex / (sectionRhythmPattern.length * repetitions)
                );

                // Calculate scale position based on contour and complexity
                const scalePosition = Math.floor(
                  contourPosition * scale.length +
                    ((Math.random() * complexity) / 5 - complexity / 10)
                );

                // Clamp to valid scale indices
                const clampedPosition = Math.min(scale.length - 1, Math.max(0, scalePosition));

                // Adjust note to fit chord (prefer chord tones)
                let adjustedPosition = clampedPosition;
                if (chord.notes && chord.notes.length > 0 && Math.random() < 0.7) {
                  // Extract note names from chord notes (without octave)
                  const chordNoteNames = chord.notes.map(note => note.slice(0, -1));

                  // Find the closest chord tone
                  const scaleNoteName = scale[clampedPosition].slice(0, -1);
                  if (!chordNoteNames.includes(scaleNoteName)) {
                    // Find a chord tone to use instead
                    const randomChordNote =
                      chordNoteNames[Math.floor(Math.random() * chordNoteNames.length)];
                    // Find this note in the scale
                    const newIndex = scale.findIndex(note => note.slice(0, -1) === randomChordNote);
                    if (newIndex !== -1) {
                      adjustedPosition = newIndex;
                    }
                  }
                }

                const note = scale[adjustedPosition];

                // Velocity (0-127 in MIDI, but normalized to 0-1 for Tone.js)
                // Make chorus notes slightly louder
                const velocityBase = currentSection === 'chorus' ? 0.8 : 0.7;
                const velocity = velocityBase + Math.random() * 0.3;

                melodyNotes.push({
                  pitch: note,
                  duration: duration,
                  velocity: velocity,
                  startTime: chordTime,
                  section: currentSection,
                });

                chordTime += duration;
                patternIndex++;
              }
            }
          }
        });

        // Apply section-specific articulation and dynamics
        let verseNotes = melodyNotes.filter(note => note.section === 'verse');
        let chorusNotes = melodyNotes.filter(note => note.section === 'chorus');
        let introNotes = melodyNotes.filter(note => note.section === 'intro');
        let outroNotes = melodyNotes.filter(note => note.section === 'outro');

        // Apply different articulations to different sections
        if (melodyArticulation !== 'none') {
          verseNotes = applyArticulation(verseNotes, melodyArticulation);
          chorusNotes = applyArticulation(chorusNotes, 'marcato'); // More pronounced for chorus
          introNotes = applyArticulation(introNotes, 'legato');
          outroNotes = applyArticulation(outroNotes, 'tenuto');
        }

        // Apply different dynamics to different sections
        if (melodyDynamics !== 'none') {
          verseNotes = applyDynamics(verseNotes, melodyDynamics);
          chorusNotes = applyDynamics(chorusNotes, 'crescendo'); // Building intensity for chorus
          introNotes = applyDynamics(introNotes, 'fade');
          outroNotes = applyDynamics(outroNotes, 'diminuendo');
        }

        // Recombine all notes
        melodyNotes = [...introNotes, ...verseNotes, ...chorusNotes, ...outroNotes].sort(
          (a, b) => a.startTime - b.startTime
        );
      } else {
        // Standard melody generation without verse/chorus structure
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
              melodyNotes.push({
                pitch: scale[scaleIndex],
                duration: motifNote.duration,
                velocity: 0.7 + Math.random() * 0.3,
                startTime: currentTime,
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
              const contourPosition = contourFn(
                patternIndex / (totalPatterns * selectedPattern.length)
              );

              // Calculate scale position based on contour and complexity
              const scalePosition = Math.floor(
                contourPosition * scale.length +
                  ((Math.random() * complexity) / 5 - complexity / 10)
              );

              // Clamp to valid scale indices
              const clampedPosition = Math.min(scale.length - 1, Math.max(0, scalePosition));
              const note = scale[clampedPosition];

              // Velocity (0-127 in MIDI, but normalized to 0-1 for Tone.js)
              const velocity = 0.7 + Math.random() * 0.3; // Between 0.7 and 1.0

              melodyNotes.push({
                pitch: note,
                duration: duration,
                velocity: velocity,
                startTime: currentTime,
              });

              currentTime += duration;
              patternIndex++;
            }
          }
        }

        // Trim notes to fit within the specified number of bars
        const totalDuration = bars * 4; // 4 beats per bar
        melodyNotes = melodyNotes.filter(note => note.startTime < totalDuration);

        // Apply articulation if selected
        if (melodyArticulation !== 'none') {
          melodyNotes = applyArticulation(melodyNotes, melodyArticulation);
        }

        // Apply dynamics if selected
        if (melodyDynamics !== 'none') {
          melodyNotes = applyDynamics(melodyNotes, melodyDynamics);
        }
      }

      // Apply humanization if enabled (for both verse/chorus and standard)
      if (humanize) {
        melodyNotes = humanizeNotes(melodyNotes, {
          timingVariation: 0.02,
          velocityVariation: 0.1,
          durationVariation: 0.05,
        });
      }
    } else {
      console.error(`No scale found for key: ${selectedKey}`);
      // Add a default C major scale melody as fallback
      const defaultScale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      for (let i = 0; i < bars * 4; i++) {
        const randomIndex = Math.floor(Math.random() * defaultScale.length);
        melodyNotes.push({
          pitch: defaultScale[randomIndex],
          duration: 1, // Quarter note
          velocity: 0.8,
          startTime: currentTime,
        });
        currentTime += 1;
      }
    }

    // Generate bass line
    let bassNotes = [];
    currentTime = 0;

    // Define bass patterns
    const bassPatterns = {
      basic: (chord, duration) => {
        // Just the root note for the whole chord duration
        // Ensure the root note is valid
        if (!chord.root) {
          console.warn('No root note found for chord:', chord);
          // Default to C if no root is available
          return [
            {
              pitch: `C${bassOctave}`,
              duration: duration * 4,
              velocity: 0.9,
              startTime: 0,
              section: chord.section,
            },
          ];
        }

        // Extract just the note name without any octave information
        // This is important because chord.root might already include an octave
        const rootNoteName = chord.root.replace(/\d+$/, '');

        return [
          {
            pitch: `${rootNoteName}${bassOctave}`,
            duration: duration * 4,
            velocity: 0.9,
            startTime: 0,
            section: chord.section,
          },
        ];
      },
      walking: (chord, duration) => {
        // Walking bass - root, fifth, octave, fifth
        const notes = [];

        // Ensure the root note is valid
        if (!chord.root) {
          console.warn('No root note found for chord:', chord);
          return bassPatterns.basic(chord, duration);
        }

        // Extract just the note name without any octave information
        const rootNoteName = chord.root.replace(/\d+$/, '');

        // Try to get MIDI number for the root note
        const rootMidi = noteToMidi ? noteToMidi(`${rootNoteName}${bassOctave}`) : 0;

        // If noteToMidi is not available or fails, fall back to basic pattern
        if (!rootMidi) {
          return bassPatterns.basic(chord, duration);
        }

        // Create a walking bass pattern
        notes.push({
          pitch: `${rootNoteName}${bassOctave}`,
          duration: 1,
          velocity: 0.9,
          startTime: 0,
          section: chord.section,
        });

        // Use midiToNote to get the fifth note (7 semitones up)
        const fifthNote = midiToNote ? midiToNote(rootMidi + 7) : `${rootNoteName}${bassOctave}`;
        notes.push({
          pitch: fifthNote,
          duration: 1,
          velocity: 0.8,
          startTime: 1,
          section: chord.section,
        });

        // Use midiToNote to get the octave note (12 semitones up)
        const octaveNote = midiToNote
          ? midiToNote(rootMidi + 12)
          : `${rootNoteName}${bassOctave + 1}`;
        notes.push({
          pitch: octaveNote,
          duration: 1,
          velocity: 0.85,
          startTime: 2,
          section: chord.section,
        });

        // Use the fifth note again
        notes.push({
          pitch: fifthNote,
          duration: 1,
          velocity: 0.8,
          startTime: 3,
          section: chord.section,
        });

        return notes;
      },
      arpeggio: (chord, duration) => {
        // Arpeggiated bass - use chord notes
        const notes = [];
        const beatsPerChord = duration * 4;
        const notesPerBeat = 1;
        const totalNotes = beatsPerChord * notesPerBeat;

        // If we don't have chord notes, fall back to basic pattern
        if (!chord.notes || chord.notes.length === 0) {
          return bassPatterns.basic(chord, duration);
        }

        // Create an arpeggio pattern using the chord notes
        for (let i = 0; i < totalNotes; i++) {
          const noteIndex = i % chord.notes.length;
          const chordNote = chord.notes[noteIndex];

          try {
            // Extract the note name without octave
            // Make sure the chord note is a valid string
            if (typeof chordNote !== 'string') {
              console.warn(`Invalid chord note: ${chordNote}, skipping`);
              continue;
            }

            // Extract just the note name without any octave information
            const noteName = chordNote.replace(/\d+$/, '');

            // Skip if we couldn't extract a valid note name
            if (!noteName) {
              console.warn(`Couldn't extract note name from: ${chordNote}, skipping`);
              continue;
            }

            notes.push({
              pitch: `${noteName}${bassOctave}`,
              duration: 1 / notesPerBeat,
              velocity: 0.85 + (i % 4 === 0 ? 0.1 : 0),
              startTime: i / notesPerBeat,
              section: chord.section,
            });
          } catch (error) {
            console.error(`Error processing chord note ${chordNote}:`, error);
            // Continue with the next note
          }
        }

        // If we couldn't create any valid notes, fall back to basic pattern
        if (notes.length === 0) {
          return bassPatterns.basic(chord, duration);
        }

        return notes;
      },
      octaves: (chord, duration) => {
        // Alternating octaves - root, octave down, root, octave down
        const notes = [];

        // Ensure the root note is valid
        if (!chord.root) {
          console.warn('No root note found for chord:', chord);
          return bassPatterns.basic(chord, duration);
        }

        // Extract just the note name without any octave information
        const rootNoteName = chord.root.replace(/\d+$/, '');

        notes.push({
          pitch: `${rootNoteName}${bassOctave}`,
          duration: 1,
          velocity: 0.9,
          startTime: 0,
          section: chord.section,
        });

        notes.push({
          pitch: `${rootNoteName}${bassOctave - 1}`,
          duration: 1,
          velocity: 0.85,
          startTime: 1,
          section: chord.section,
        });

        notes.push({
          pitch: `${rootNoteName}${bassOctave}`,
          duration: 1,
          velocity: 0.9,
          startTime: 2,
          section: chord.section,
        });

        notes.push({
          pitch: `${rootNoteName}${bassOctave - 1}`,
          duration: 1,
          velocity: 0.85,
          startTime: 3,
          section: chord.section,
        });

        return notes;
      },
      fifths: (chord, duration) => {
        // Root and fifth pattern
        const notes = [];

        // Ensure the root note is valid
        if (!chord.root) {
          console.warn('No root note found for chord:', chord);
          return bassPatterns.basic(chord, duration);
        }

        // Extract just the note name without any octave information
        const rootNoteName = chord.root.replace(/\d+$/, '');

        // Try to get MIDI number for the root note
        const rootMidi = noteToMidi ? noteToMidi(`${rootNoteName}${bassOctave}`) : 0;

        // If noteToMidi is not available or fails, fall back to basic pattern
        if (!rootMidi) {
          return bassPatterns.basic(chord, duration);
        }

        // Create a root-fifth pattern
        notes.push({
          pitch: `${rootNoteName}${bassOctave}`,
          duration: 2,
          velocity: 0.9,
          startTime: 0,
          section: chord.section,
        });

        // Use midiToNote to get the fifth note (7 semitones up)
        const fifthNote = midiToNote ? midiToNote(rootMidi + 7) : `${rootNoteName}${bassOctave}`;
        notes.push({
          pitch: fifthNote,
          duration: 2,
          velocity: 0.85,
          startTime: 2,
          section: chord.section,
        });

        return notes;
      },
      groove: (chord, duration) => {
        // Groove bass - syncopated rhythm with root and fifth
        const notes = [];

        // Ensure the root note is valid
        if (!chord.root) {
          console.warn('No root note found for chord:', chord);
          return bassPatterns.basic(chord, duration);
        }

        // Extract just the note name without any octave information
        const rootNoteName = chord.root.replace(/\d+$/, '');

        // Try to get MIDI number for the root note
        const rootMidi = noteToMidi ? noteToMidi(`${rootNoteName}${bassOctave}`) : 0;

        // If noteToMidi is not available or fails, fall back to basic pattern
        if (!rootMidi) {
          return bassPatterns.basic(chord, duration);
        }

        // Create a groove pattern
        notes.push({
          pitch: `${rootNoteName}${bassOctave}`,
          duration: 0.75,
          velocity: 0.95,
          startTime: 0,
          section: chord.section,
        });

        notes.push({
          pitch: `${rootNoteName}${bassOctave}`,
          duration: 0.25,
          velocity: 0.7,
          startTime: 1,
          section: chord.section,
        });

        // Use midiToNote to get the fifth note (7 semitones up)
        const fifthNote = midiToNote ? midiToNote(rootMidi + 7) : `${rootNoteName}${bassOctave}`;
        notes.push({
          pitch: fifthNote,
          duration: 0.5,
          velocity: 0.8,
          startTime: 1.5,
          section: chord.section,
        });

        notes.push({
          pitch: `${rootNoteName}${bassOctave}`,
          duration: 1,
          velocity: 0.9,
          startTime: 2,
          section: chord.section,
        });

        notes.push({
          pitch: fifthNote,
          duration: 0.5,
          velocity: 0.75,
          startTime: 3,
          section: chord.section,
        });

        notes.push({
          pitch: `${rootNoteName}${bassOctave}`,
          duration: 0.5,
          velocity: 0.85,
          startTime: 3.5,
          section: chord.section,
        });

        return notes;
      },
    };

    if (useVerseChorus) {
      // Use different bass patterns for different sections
      formattedChords.forEach(chord => {
        let sectionBassPattern;

        // Select bass pattern based on section
        if (chord.section === 'verse') {
          // Verses often use simpler patterns
          sectionBassPattern = bassPatterns['walking'] || bassPatterns.basic;
        } else if (chord.section === 'chorus') {
          // Choruses often use more energetic patterns
          sectionBassPattern = bassPatterns['groove'] || bassPatterns.walking;
        } else if (chord.section === 'intro') {
          // Intros often use simple patterns
          sectionBassPattern = bassPatterns['basic'] || bassPatterns.basic;
        } else if (chord.section === 'outro') {
          // Outros often use more complex patterns
          sectionBassPattern = bassPatterns['fifths'] || bassPatterns.basic;
        } else {
          // Default to selected pattern
          sectionBassPattern = bassPatterns[bassPattern] || bassPatterns.basic;
        }

        // Generate bass notes for this chord
        const chordBassNotes = sectionBassPattern(chord, chord.duration);

        // Add the notes to the bass line with the correct start time
        chordBassNotes.forEach(note => {
          bassNotes.push({
            pitch: note.pitch,
            duration: note.duration,
            velocity: note.velocity,
            startTime: currentTime + note.startTime,
            section: note.section,
          });
        });

        // Update the current time
        currentTime += chord.duration * 4;
      });

      // Apply section-specific dynamics
      let verseBass = bassNotes.filter(note => note.section === 'verse');
      let chorusBass = bassNotes.filter(note => note.section === 'chorus');
      let introBass = bassNotes.filter(note => note.section === 'intro');
      let outroBass = bassNotes.filter(note => note.section === 'outro');

      // Apply different dynamics to different sections
      verseBass = applyDynamics(verseBass, 'accent');
      chorusBass = applyDynamics(chorusBass, 'crescendo'); // Building intensity for chorus
      introBass = applyDynamics(introBass, 'fade');
      outroBass = applyDynamics(outroBass, 'diminuendo');

      // Recombine all notes
      bassNotes = [...introBass, ...verseBass, ...chorusBass, ...outroBass].sort(
        (a, b) => a.startTime - b.startTime
      );
    } else {
      // Standard bass generation without verse/chorus structure
      // Select the bass pattern to use
      const selectedBassPattern = bassPatterns[bassPattern] || bassPatterns.basic;

      // Generate bass notes for each chord
      formattedChords.forEach(chord => {
        // Generate bass notes for this chord
        const chordBassNotes = selectedBassPattern(chord, chord.duration);

        // Add the notes to the bass line with the correct start time
        chordBassNotes.forEach(note => {
          bassNotes.push({
            pitch: note.pitch,
            duration: note.duration,
            velocity: note.velocity,
            startTime: currentTime + note.startTime,
          });
        });

        // Update the current time
        currentTime += chord.duration * 4;
      });
    }

    // Apply humanization if enabled
    if (humanize) {
      bassNotes = humanizeNotes(bassNotes, {
        timingVariation: 0.01,
        velocityVariation: 0.05,
        durationVariation: 0.02,
      });
    }

    // Create the composition data
    const compositionData = {
      key: selectedKey,
      tempo: tempo,
      bars: bars,
      structure: useVerseChorus ? structure : 'simple',
      melody: {
        notes: melodyNotes,
        instrument: 'acoustic_grand_piano',
        rhythmPattern: rhythmPattern,
        contourType: contourType,
        useMotif: useMotif,
        motifVariation: motifVariation,
        articulation: melodyArticulation,
        dynamics: melodyDynamics,
      },
      chord: {
        progression: formattedChords,
        instrument: 'acoustic_guitar_nylon',
        useVoiceLeading: useVoiceLeading,
        useInversions: useInversions,
        inversion: inversion,
        useExtendedChords: useExtendedChords,
        verseProgression: useVerseChorus ? verseProgression : null,
        chorusProgression: useVerseChorus ? chorusProgression : null,
      },
      bass: {
        notes: bassNotes,
        instrument: 'electric_bass_finger',
        pattern: bassPattern,
        octave: bassOctave,
        complexity: bassComplexity,
      },
      humanize: humanize,
    };

    setComposition(compositionData);

    // Call the callback function if provided
    if (onCompositionGenerated) {
      onCompositionGenerated(compositionData);
    }

    return compositionData;
  };

  // Play the melody part
  // This function is not currently used in the UI as playback has been moved to the PlaybackContext
  // Keeping it for reference or future use
  const _playMelodyLegacy = async () => {
    if (!composition || !composition.melody || !composition.melody.notes) {
      return;
    }

    if (isPlaying) {
      stopPlayback();
      return;
    }

    // Ensure AudioContext is initialized (this is now safe because it's in response to a user gesture)
    try {
      const ctx = await ensureAudioContext();
      if (ctx && audioContextRef.current !== ctx) {
        audioContextRef.current = ctx;
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      // Continue anyway, we can still try to play using Tone.js
    }

    setIsPlaying(true);
    setActivePlayingPart('melody');

    const notes = composition.melody.notes;

    // Play using Tone.js
    playMelodyWithToneJs(notes);
  };

  // Play melody using Tone.js
  const playMelodyWithToneJs = async notes => {
    try {
      // Initialize Tone.js on user interaction
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        setIsPlaying(false);
        setActivePlayingPart(null);
        return;
      }

      // Create synth lazily if it doesn't exist
      if (!melodySynthRef.current) {
        melodySynthRef.current = createSynth();
      }

      Tone.Transport.bpm.value = tempo;

      const now = Tone.now();
      notes.forEach(note => {
        const durationSeconds = (note.duration * 60) / tempo;
        const startTime = now + (note.startTime * 60) / tempo;

        melodySynthRef.current.triggerAttackRelease(
          note.pitch,
          durationSeconds,
          startTime,
          note.velocity
        );
      });

      const totalDuration = notes.reduce(
        (max, note) => Math.max(max, note.startTime + note.duration),
        0
      );

      setTimeout(
        () => {
          setIsPlaying(false);
          setActivePlayingPart(null);
        },
        ((totalDuration * 60) / tempo) * 1000 + 500
      );
    } catch (error) {
      console.error('Error playing melody with Tone.js:', error);
      setIsPlaying(false);
      setActivePlayingPart(null);
    }
  };

  // Play the chord part
  // This function is not currently used in the UI as playback has been moved to the PlaybackContext
  // Keeping it for reference or future use
  const _playChordsLegacy = async () => {
    if (!composition || !composition.chord || !composition.chord.progression) {
      return;
    }

    if (isPlaying) {
      stopPlayback();
      return;
    }

    // Ensure AudioContext is initialized (this should be called in response to a user gesture)
    try {
      const ctx = await ensureAudioContext();
      if (ctx && audioContextRef.current !== ctx) {
        audioContextRef.current = ctx;
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      // Continue anyway, we can still try to play using Tone.js
    }

    setIsPlaying(true);
    setActivePlayingPart('chord');

    const chords = composition.chord.progression;

    // Play using Tone.js
    playChordsWithToneJs(chords);
  };

  // Play chords using Tone.js
  const playChordsWithToneJs = async chords => {
    try {
      // Initialize Tone.js on user interaction
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        setIsPlaying(false);
        setActivePlayingPart(null);
        return;
      }

      // Create synth lazily if it doesn't exist
      if (!chordSynthRef.current) {
        chordSynthRef.current = createSynth();
      }

      Tone.Transport.bpm.value = tempo;

      const now = Tone.now();
      const secondsPerBar = (60 / tempo) * 4; // 4 beats per bar

      chords.forEach(chord => {
        const startTime = now + chord.position * secondsPerBar;
        const duration = chord.duration * secondsPerBar;

        chordSynthRef.current.triggerAttackRelease(chord.notes, duration, startTime);
      });

      const totalDuration =
        chords.reduce((sum, chord) => Math.max(sum, chord.position + chord.duration), 0) *
        secondsPerBar *
        1000;

      setTimeout(() => {
        setIsPlaying(false);
        setActivePlayingPart(null);
      }, totalDuration + 500);
    } catch (error) {
      console.error('Error playing chords with Tone.js:', error);
      setIsPlaying(false);
      setActivePlayingPart(null);
    }
  };

  // Play the bass part
  // This function is not currently used in the UI as playback has been moved to the PlaybackContext
  // Keeping it for reference or future use
  const _playBassLegacy = async () => {
    if (!composition || !composition.bass || !composition.bass.notes) {
      return;
    }

    if (isPlaying) {
      stopPlayback();
      return;
    }

    // Ensure AudioContext is initialized (this should be called in response to a user gesture)
    try {
      const ctx = await ensureAudioContext();
      if (ctx && audioContextRef.current !== ctx) {
        audioContextRef.current = ctx;
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      // Continue anyway, we can still try to play using Tone.js
    }

    setIsPlaying(true);
    setActivePlayingPart('bass');

    const notes = composition.bass.notes;

    // Play using Tone.js
    playBassWithToneJs(notes);
  };

  // Play bass using Tone.js
  const playBassWithToneJs = async notes => {
    try {
      // Initialize Tone.js on user interaction
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        setIsPlaying(false);
        setActivePlayingPart(null);
        return;
      }

      // Create synth lazily if it doesn't exist
      if (!bassSynthRef.current) {
        bassSynthRef.current = createSynth();
      }

      Tone.Transport.bpm.value = tempo;

      const now = Tone.now();
      notes.forEach(note => {
        const durationSeconds = (note.duration * 60) / tempo;
        const startTime = now + (note.startTime * 60) / tempo;

        bassSynthRef.current.triggerAttackRelease(
          note.pitch,
          durationSeconds,
          startTime,
          note.velocity
        );
      });

      const totalDuration = notes.reduce(
        (max, note) => Math.max(max, note.startTime + note.duration),
        0
      );

      setTimeout(
        () => {
          setIsPlaying(false);
          setActivePlayingPart(null);
        },
        ((totalDuration * 60) / tempo) * 1000 + 500
      );
    } catch (error) {
      console.error('Error playing bass with Tone.js:', error);
      setIsPlaying(false);
      setActivePlayingPart(null);
    }
  };

  // Play the full composition
  // This function is not currently used in the UI as playback has been moved to the PlaybackContext
  // Keeping it for reference or future use
  const _playCompositionLegacy = async () => {
    if (!composition) {
      return;
    }

    if (isPlaying) {
      stopPlayback();
      return;
    }

    // Ensure AudioContext is initialized (this should be called in response to a user gesture)
    try {
      const ctx = await ensureAudioContext();
      if (ctx && audioContextRef.current !== ctx) {
        audioContextRef.current = ctx;
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      // Continue anyway, we can still try to play using Tone.js
    }

    setIsPlaying(true);
    setActivePlayingPart('all');

    // Play all parts simultaneously
    const melodyPromise = new Promise(resolve => {
      playMelodyWithToneJs(composition.melody.notes);
      // This is an approximation since we can't easily know when Tone.js finishes
      const totalDuration = composition.melody.notes.reduce(
        (max, note) => Math.max(max, note.startTime + note.duration),
        0
      );
      setTimeout(resolve, ((totalDuration * 60) / tempo) * 1000 + 500);
    });

    const chordPromise = new Promise(resolve => {
      playChordsWithToneJs(composition.chord.progression);
      const secondsPerBar = (60 / tempo) * 4;
      const totalDuration =
        composition.chord.progression.reduce(
          (sum, chord) => Math.max(sum, chord.position + chord.duration),
          0
        ) *
        secondsPerBar *
        1000;
      setTimeout(resolve, totalDuration + 500);
    });

    const bassPromise = new Promise(resolve => {
      playBassWithToneJs(composition.bass.notes);
      const totalDuration = composition.bass.notes.reduce(
        (max, note) => Math.max(max, note.startTime + note.duration),
        0
      );
      setTimeout(resolve, ((totalDuration * 60) / tempo) * 1000 + 500);
    });

    // Wait for all parts to finish
    await Promise.all([melodyPromise, chordPromise, bassPromise]);

    setIsPlaying(false);
    setActivePlayingPart(null);
  };

  // Stop all playback
  const stopPlayback = () => {
    // Stop Tone.js playback if it's initialized
    if (melodySynthRef.current || chordSynthRef.current || bassSynthRef.current) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    }

    setIsPlaying(false);
    setActivePlayingPart(null);
  };

  return (
    <Card
      p={6}
      variant="elevated"
      bg="rgba(30, 41, 59, 0.5)"
      backdropFilter="blur(12px)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
    >
      <CardHeader pb={4}>
        <Heading size="lg" color="primary.400">
          Composition Generator
        </Heading>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Basic Controls */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <FormControl>
              <FormLabel>Key</FormLabel>
              <Select
                value={selectedKey}
                onChange={e => setSelectedKey(e.target.value)}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
                _hover={{ borderColor: 'primary.400' }}
              >
                {keyOptions.map(key => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Tempo (BPM): {tempo}</FormLabel>
              <Slider
                min={60}
                max={180}
                value={tempo}
                onChange={val => setTempo(val)}
                focusThumbOnChange={false}
              >
                <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                  <SliderFilledTrack bg="primary.500" />
                </SliderTrack>
                <SliderThumb boxSize={6} />
              </Slider>
            </FormControl>

            <FormControl>
              <FormLabel>Bars</FormLabel>
              <NumberInput
                min={1}
                max={16}
                value={bars}
                onChange={valueString => setBars(parseInt(valueString))}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </SimpleGrid>

          {/* Advanced Options Tabs */}
          <Box mt={4} p={4} borderRadius="md" bg="rgba(255, 255, 255, 0.05)">
            <Tabs variant="soft-rounded" colorScheme="primary" size="md">
              <TabList mb={4}>
                <Tab>General</Tab>
                <Tab>Melody</Tab>
                <Tab>Chords</Tab>
                <Tab>Bass</Tab>
                <Tab>Structure</Tab>
              </TabList>

              <TabPanels>
                {/* General Tab */}
                <TabPanel>
                  <FormControl mb={4}>
                    <FormLabel>Auto-Randomize Options</FormLabel>
                    <Flex align="center">
                      <Checkbox
                        isChecked={autoRandomize}
                        onChange={e => setAutoRandomize(e.target.checked)}
                        colorScheme="primary"
                        mr={2}
                      />
                      <Text>Automatically randomize advanced options when generating</Text>
                      <Tooltip
                        label="When enabled, advanced options will be randomized each time you generate a new composition"
                        hasArrow
                        placement="top"
                      >
                        <Box as="span" ml={1} color="gray.300" fontSize="sm">
                          ⓘ
                        </Box>
                      </Tooltip>
                    </Flex>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Humanization</FormLabel>
                    <Flex align="center">
                      <Checkbox
                        isChecked={humanize}
                        onChange={e => setHumanize(e.target.checked)}
                        colorScheme="primary"
                        mr={2}
                      />
                      <Text>Apply humanization to all parts</Text>
                      <Tooltip
                        label="Adds subtle timing and velocity variations to make the music sound more natural"
                        hasArrow
                        placement="top"
                      >
                        <Box as="span" ml={1} color="gray.300" fontSize="sm">
                          ⓘ
                        </Box>
                      </Tooltip>
                    </Flex>
                  </FormControl>
                </TabPanel>

                {/* Melody Tab */}
                <TabPanel>
                  <Heading size="sm" mb={3}>
                    Melody Options
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Complexity: {complexity}</FormLabel>
                      <Slider
                        min={1}
                        max={10}
                        value={complexity}
                        onChange={val => setComplexity(val)}
                        focusThumbOnChange={false}
                      >
                        <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                          <SliderFilledTrack bg="primary.500" />
                        </SliderTrack>
                        <SliderThumb boxSize={6} />
                      </Slider>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Rhythm Pattern</FormLabel>
                      <Select
                        value={rhythmPattern}
                        onChange={e => setRhythmPattern(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        {Object.keys(rhythmPatterns).map(pattern => (
                          <option key={pattern} value={pattern}>
                            {pattern}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Melodic Contour</FormLabel>
                      <Select
                        value={contourType}
                        onChange={e => setContourType(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        {Object.keys(contourTypes).map(contour => (
                          <option key={contour} value={contour}>
                            {contour}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Articulation</FormLabel>
                      <Select
                        value={melodyArticulation}
                        onChange={e => setMelodyArticulation(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        <option value="none">None</option>
                        <option value="legato">Legato</option>
                        <option value="staccato">Staccato</option>
                        <option value="marcato">Marcato</option>
                        <option value="tenuto">Tenuto</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Dynamics</FormLabel>
                      <Select
                        value={melodyDynamics}
                        onChange={e => setMelodyDynamics(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        <option value="none">None</option>
                        <option value="crescendo">Crescendo</option>
                        <option value="diminuendo">Diminuendo</option>
                        <option value="swell">Swell</option>
                        <option value="fade">Fade</option>
                        <option value="accent">Accent</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Motif</FormLabel>
                        <Checkbox
                          isChecked={useMotif}
                          onChange={e => setUseMotif(e.target.checked)}
                          colorScheme="primary"
                        />
                        <Tooltip
                          label="Uses a short musical idea that repeats with variations"
                          hasArrow
                          placement="top"
                        >
                          <Box as="span" ml={1} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </Flex>
                    </FormControl>

                    {useMotif && (
                      <FormControl>
                        <FormLabel>Motif Variation</FormLabel>
                        <Select
                          value={motifVariation}
                          onChange={e => setMotifVariation(e.target.value)}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: 'primary.400' }}
                        >
                          <option value="transpose">Transpose</option>
                          <option value="invert">Invert</option>
                          <option value="retrograde">Retrograde</option>
                          <option value="augment">Augment</option>
                          <option value="diminish">Diminish</option>
                        </Select>
                      </FormControl>
                    )}
                  </SimpleGrid>
                </TabPanel>

                {/* Chords Tab */}
                <TabPanel>
                  <Heading size="sm" mb={3}>
                    Chord Options
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Chord Progression</FormLabel>
                      <Select
                        value={selectedProgression}
                        onChange={e => setSelectedProgression(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        {Object.keys(availableProgressions).map(prog => (
                          <option key={prog} value={prog}>
                            {prog}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Chord Duration (bars)</FormLabel>
                      <NumberInput
                        min={0.5}
                        max={4}
                        step={0.5}
                        value={chordDuration}
                        onChange={valueString => setChordDuration(parseFloat(valueString))}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Voice Leading</FormLabel>
                        <Checkbox
                          isChecked={useVoiceLeading}
                          onChange={e => setUseVoiceLeading(e.target.checked)}
                          colorScheme="primary"
                        />
                        <Tooltip
                          label="Creates smoother transitions between chords"
                          hasArrow
                          placement="top"
                        >
                          <Box as="span" ml={1} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </Flex>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Inversions</FormLabel>
                        <Checkbox
                          isChecked={useInversions}
                          onChange={e => setUseInversions(e.target.checked)}
                          colorScheme="primary"
                        />
                        <Tooltip
                          label="Changes which note of the chord is in the bass"
                          hasArrow
                          placement="top"
                        >
                          <Box as="span" ml={1} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </Flex>
                    </FormControl>

                    {useInversions && (
                      <FormControl>
                        <FormLabel>Inversion</FormLabel>
                        <Select
                          value={inversion}
                          onChange={e => setInversion(parseInt(e.target.value))}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: 'primary.400' }}
                        >
                          <option value="0">Root Position</option>
                          <option value="1">First Inversion</option>
                          <option value="2">Second Inversion</option>
                          <option value="3">Third Inversion</option>
                        </Select>
                      </FormControl>
                    )}

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Extended Chords</FormLabel>
                        <Checkbox
                          isChecked={useExtendedChords}
                          onChange={e => setUseExtendedChords(e.target.checked)}
                          colorScheme="primary"
                        />
                        <Tooltip
                          label="Adds 7ths, 9ths, and other extensions to chords"
                          hasArrow
                          placement="top"
                        >
                          <Box as="span" ml={1} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </Flex>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Auto-Randomize Options</FormLabel>
                        <Checkbox
                          isChecked={autoRandomize}
                          onChange={e => setAutoRandomize(e.target.checked)}
                          colorScheme="primary"
                        />
                        <Tooltip
                          label="Automatically applies random advanced options for variety"
                          hasArrow
                          placement="top"
                        >
                          <Box as="span" ml={1} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </Flex>
                    </FormControl>
                  </SimpleGrid>
                </TabPanel>

                {/* Bass Tab */}
                <TabPanel>
                  <Heading size="sm" mb={3}>
                    Bass Options
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Bass Pattern</FormLabel>
                      <Select
                        value={bassPattern}
                        onChange={e => setBassPattern(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        <option value="basic">Basic (Root Notes)</option>
                        <option value="walking">Walking Bass</option>
                        <option value="arpeggio">Arpeggiated</option>
                        <option value="octaves">Octave Jumps</option>
                        <option value="fifths">Root-Fifth Pattern</option>
                        <option value="groove">Groove (Syncopated)</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Bass Octave</FormLabel>
                      <NumberInput
                        min={1}
                        max={4}
                        value={bassOctave}
                        onChange={valueString => setBassOctave(parseInt(valueString))}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Bass Complexity: {bassComplexity}</FormLabel>
                      <Slider
                        min={1}
                        max={10}
                        value={bassComplexity}
                        onChange={val => setBassComplexity(val)}
                        focusThumbOnChange={false}
                      >
                        <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                          <SliderFilledTrack bg="primary.500" />
                        </SliderTrack>
                        <SliderThumb boxSize={6} />
                      </Slider>
                    </FormControl>
                  </SimpleGrid>
                </TabPanel>

                {/* Structure Tab */}
                <TabPanel>
                  <Heading size="sm" mb={3}>
                    Musical Structure
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Verse/Chorus Structure</FormLabel>
                        <Checkbox
                          isChecked={useVerseChorus}
                          onChange={e => setUseVerseChorus(e.target.checked)}
                          colorScheme="primary"
                        />
                        <Tooltip
                          label="Creates a more complex song structure with verses and choruses"
                          hasArrow
                          placement="top"
                        >
                          <Box as="span" ml={1} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </Flex>
                    </FormControl>

                    {useVerseChorus && (
                      <>
                        <FormControl>
                          <FormLabel>Song Structure</FormLabel>
                          <Select
                            value={structure}
                            onChange={e => setStructure(e.target.value)}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: 'primary.400' }}
                          >
                            <option value="verse-chorus">Verse-Chorus</option>
                            <option value="verse-chorus-verse-chorus">
                              Verse-Chorus-Verse-Chorus
                            </option>
                            <option value="intro-verse-chorus-verse-chorus-outro">
                              Intro-Verse-Chorus-Verse-Chorus-Outro
                            </option>
                            <option value="verse-verse-chorus-verse">
                              Verse-Verse-Chorus-Verse
                            </option>
                            <option value="chorus-verse-chorus">Chorus-Verse-Chorus</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Verse Progression</FormLabel>
                          <Select
                            value={verseProgression}
                            onChange={e => setVerseProgression(e.target.value)}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: 'primary.400' }}
                          >
                            {Object.keys(availableProgressions).map(prog => (
                              <option key={prog} value={prog}>
                                {prog}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Chorus Progression</FormLabel>
                          <Select
                            value={chorusProgression}
                            onChange={e => setChorusProgression(e.target.value)}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: 'primary.400' }}
                          >
                            {Object.keys(availableProgressions).map(prog => (
                              <option key={prog} value={prog}>
                                {prog}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <Box
                          gridColumn="span 2"
                          p={4}
                          bg="rgba(255, 255, 255, 0.05)"
                          borderRadius="md"
                        >
                          <Text fontSize="sm" color="gray.300">
                            Using verse/chorus structure will create a more complex composition with
                            different chord progressions for verses and choruses. The melody and
                            bass will adapt to these changes, creating a more interesting and
                            dynamic piece of music.
                          </Text>
                        </Box>
                      </>
                    )}
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>

          {/* Action Buttons */}
          <HStack spacing={4} mt={6}>
            <Button
              onClick={() => {
                // Just generate the composition without initializing AudioContext
                generateComposition();
              }}
              colorScheme="primary"
              size="lg"
              leftIcon={
                <Box as="span" className="icon">
                  🎼
                </Box>
              }
            >
              Generate Composition
            </Button>
          </HStack>

          {/* Composition Info */}
          {composition && (
            <Box
              mt={8}
              p={4}
              borderRadius="md"
              bg="rgba(255, 255, 255, 0.08)"
              borderLeft="4px solid"
              borderColor="primary.500"
              boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
            >
              <Heading size="md" mb={4} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                Generated Composition
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Key:
                  </Badge>{' '}
                  {composition.key}
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Tempo:
                  </Badge>{' '}
                  {composition.tempo} BPM
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Length:
                  </Badge>{' '}
                  {composition.bars} bars
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Melody Notes:
                  </Badge>{' '}
                  {composition.melody.notes.length}
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Chords:
                  </Badge>{' '}
                  {composition.chord.progression.length}
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Bass Notes:
                  </Badge>{' '}
                  {composition.bass.notes.length}
                </Text>
              </SimpleGrid>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

export default CompositionGenerator;
