import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { initializeTone } from './toneContext';
import { ensureAudioContext, hasHadUserInteraction } from './audioContext';
import {
  loadInstrument,
  playMelodyWithSoundFont,
  playChordProgressionWithSoundFont,
} from './soundfontUtils';
import * as Tone from 'tone';

const PlaybackContext = createContext();

export function PlaybackProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayingPart, setActivePlayingPart] = useState(null);
  const [useSoundFont, setUseSoundFont] = useState(true); // Default to using SoundFont
  const [instrumentsLoading, setInstrumentsLoading] = useState(false);

  const [melodyInstrument, setMelodyInstrument] = useState('acoustic_grand_piano');
  const [chordInstrument, setChordInstrument] = useState('acoustic_guitar_nylon');
  const [bassInstrument, setBassInstrument] = useState('electric_bass_finger');

  const melodySynthRef = useRef(null);
  const chordSynthRef = useRef(null);
  const bassSynthRef = useRef(null);

  const melodyInstrumentRef = useRef(null);
  const chordInstrumentRef = useRef(null);
  const bassInstrumentRef = useRef(null);

  const audioContextRef = useRef(null);

  const createSynth = async (type = 'default') => {
    // Ensure Tone.js is initialized before creating synths
    const success = await initializeTone();
    if (!success) {
      console.error('Failed to initialize Tone.js, cannot create synth');
      return null;
    }

    let synth;

    switch (type) {
      case 'melody':
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.volume.value = -6; // Slightly quieter
        break;
      case 'chord':
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.volume.value = -8; // Even quieter
        break;
      case 'bass':
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.volume.value = -4; // Louder
        break;
      default:
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.volume.value = -6;
    }

    return synth;
  };

  // Load SoundFont instruments
  const loadSoundFontInstruments = async () => {
    try {
      setInstrumentsLoading(true);

      // Check if we've had user interaction before trying to initialize AudioContext
      if (!hasHadUserInteraction()) {
        console.log('No user interaction yet, cannot initialize AudioContext');
        setInstrumentsLoading(false);
        return false;
      }

      // Ensure AudioContext is initialized
      const ctx = await ensureAudioContext();
      if (!ctx) {
        console.error('Failed to initialize AudioContext');
        setUseSoundFont(false);
        setInstrumentsLoading(false);
        return false;
      }

      // Update our reference
      audioContextRef.current = ctx;

      // Load melody instrument
      melodyInstrumentRef.current = await loadInstrument(melodyInstrument, ctx);

      // Load chord instrument
      chordInstrumentRef.current = await loadInstrument(chordInstrument, ctx);

      // Load bass instrument
      bassInstrumentRef.current = await loadInstrument(bassInstrument, ctx);

      setInstrumentsLoading(false);
      return true;
    } catch (error) {
      console.error('Error loading SoundFont instruments:', error);
      setUseSoundFont(false);
      setInstrumentsLoading(false);
      return false;
    }
  };

  // Function to load instruments when selections change
  const loadInstruments = async () => {
    if (!useSoundFont) return;

    try {
      await loadSoundFontInstruments();
    } catch (error) {
      console.error('Error loading instruments:', error);
    }
  };

  // We'll load instruments on demand instead of automatically on mount
  // This helps avoid AudioContext errors when there's no user interaction yet

  // This effect will run when instrument selections change, but only if we've already
  // had user interaction (which is checked inside loadInstruments)
  useEffect(() => {
    if (useSoundFont) {
      // We don't automatically load on mount anymore
      // loadInstruments will check if we've had user interaction
    }
  }, [melodyInstrument, chordInstrument, bassInstrument, useSoundFont]);

  // Stop all playback
  const stopPlayback = () => {
    if (melodySynthRef.current) {
      melodySynthRef.current.releaseAll();
    }

    if (chordSynthRef.current) {
      chordSynthRef.current.releaseAll();
    }

    if (bassSynthRef.current) {
      bassSynthRef.current.releaseAll();
    }

    setIsPlaying(false);
    setActivePlayingPart(null);
  };

  // Play melody
  const playMelody = async (notes, tempo = 120) => {
    try {
      // Stop any existing playback
      stopPlayback();

      setIsPlaying(true);
      setActivePlayingPart('melody');

      // Try to play with SoundFont first
      if (useSoundFont) {
        try {
          // Load SoundFont instruments if needed
          const soundFontReady = await loadSoundFontInstruments();

          if (soundFontReady && melodyInstrumentRef.current) {
            // Play with SoundFont
            await playMelodyWithSoundFont(melodyInstrumentRef.current, notes, tempo);
            setIsPlaying(false);
            setActivePlayingPart(null);
            return;
          }
        } catch (soundFontError) {
          console.error('Error playing with SoundFont:', soundFontError);
          // Fall back to Tone.js
        }
      }

      // Fall back to Tone.js
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        setIsPlaying(false);
        setActivePlayingPart(null);
        return;
      }

      // Create synth lazily if it doesn't exist
      if (!melodySynthRef.current) {
        melodySynthRef.current = await createSynth('melody');
        if (!melodySynthRef.current) {
          console.error('Failed to create melody synth');
          setIsPlaying(false);
          setActivePlayingPart(null);
          return;
        }
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

      // Calculate when playback will end
      const lastNote = notes.reduce((latest, note) => {
        const endTime = note.startTime + note.duration;
        return endTime > latest ? endTime : latest;
      }, 0);

      const playbackDuration = (lastNote * 60) / tempo;

      // Automatically stop playing after the melody finishes
      setTimeout(
        () => {
          setIsPlaying(false);
          setActivePlayingPart(null);
        },
        playbackDuration * 1000 + 500
      ); // Add a small buffer
    } catch (error) {
      console.error('Error playing melody:', error);
      setIsPlaying(false);
      setActivePlayingPart(null);
    }
  };

  // Play chords
  const playChords = async (chords, tempo = 120) => {
    try {
      // Stop any existing playback
      stopPlayback();

      setIsPlaying(true);
      setActivePlayingPart('chord');

      // Try to play with SoundFont first
      if (useSoundFont) {
        try {
          // Load SoundFont instruments if needed
          const soundFontReady = await loadSoundFontInstruments();

          if (soundFontReady && chordInstrumentRef.current) {
            // Play with SoundFont
            await playChordProgressionWithSoundFont(chordInstrumentRef.current, chords, tempo);
            setIsPlaying(false);
            setActivePlayingPart(null);
            return;
          }
        } catch (soundFontError) {
          console.error('Error playing with SoundFont:', soundFontError);
          // Fall back to Tone.js
        }
      }

      // Fall back to Tone.js
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        setIsPlaying(false);
        setActivePlayingPart(null);
        return;
      }

      // Create synth lazily if it doesn't exist
      if (!chordSynthRef.current) {
        chordSynthRef.current = await createSynth('chord');
        if (!chordSynthRef.current) {
          console.error('Failed to create chord synth');
          setIsPlaying(false);
          setActivePlayingPart(null);
          return;
        }
      }

      Tone.Transport.bpm.value = tempo;

      const now = Tone.now();
      const secondsPerBar = (60 / tempo) * 4; // 4 beats per bar

      chords.forEach(chord => {
        const startTime = now + chord.position * secondsPerBar;
        const duration = chord.duration * secondsPerBar;

        chordSynthRef.current.triggerAttackRelease(chord.notes, duration, startTime);
      });

      // Calculate when playback will end
      const lastChord = chords.reduce((latest, chord) => {
        const endPosition = chord.position + chord.duration;
        return endPosition > latest ? endPosition : latest;
      }, 0);

      const playbackDuration = lastChord * secondsPerBar;

      // Automatically stop playing after the chords finish
      setTimeout(
        () => {
          setIsPlaying(false);
          setActivePlayingPart(null);
        },
        playbackDuration * 1000 + 500
      ); // Add a small buffer
    } catch (error) {
      console.error('Error playing chords:', error);
      setIsPlaying(false);
      setActivePlayingPart(null);
    }
  };

  // Play bass
  const playBass = async (notes, tempo = 120) => {
    try {
      // Stop any existing playback
      stopPlayback();

      setIsPlaying(true);
      setActivePlayingPart('bass');

      // Try to play with SoundFont first
      if (useSoundFont) {
        try {
          // Load SoundFont instruments if needed
          const soundFontReady = await loadSoundFontInstruments();

          if (soundFontReady && bassInstrumentRef.current) {
            // Play with SoundFont
            await playMelodyWithSoundFont(bassInstrumentRef.current, notes, tempo);
            setIsPlaying(false);
            setActivePlayingPart(null);
            return;
          }
        } catch (soundFontError) {
          console.error('Error playing with SoundFont:', soundFontError);
          // Fall back to Tone.js
        }
      }

      // Fall back to Tone.js
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        setIsPlaying(false);
        setActivePlayingPart(null);
        return;
      }

      // Create synth lazily if it doesn't exist
      if (!bassSynthRef.current) {
        bassSynthRef.current = await createSynth('bass');
        if (!bassSynthRef.current) {
          console.error('Failed to create bass synth');
          setIsPlaying(false);
          setActivePlayingPart(null);
          return;
        }
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

      // Calculate when playback will end
      const lastNote = notes.reduce((latest, note) => {
        const endTime = note.startTime + note.duration;
        return endTime > latest ? endTime : latest;
      }, 0);

      const playbackDuration = (lastNote * 60) / tempo;

      // Automatically stop playing after the bass finishes
      setTimeout(
        () => {
          setIsPlaying(false);
          setActivePlayingPart(null);
        },
        playbackDuration * 1000 + 500
      ); // Add a small buffer
    } catch (error) {
      console.error('Error playing bass:', error);
      setIsPlaying(false);
      setActivePlayingPart(null);
    }
  };

  // Play composition (melody, chords, and bass)
  const playComposition = async (composition, tempo = 120) => {
    try {
      // Stop any existing playback
      stopPlayback();

      setIsPlaying(true);
      setActivePlayingPart('composition');

      // Extract data
      const melodyNotes = composition.melody?.notes || [];
      const chords = composition.chord?.progression || [];
      const bassNotes = composition.bass?.notes || [];

      // Try to play with SoundFont first
      if (useSoundFont) {
        try {
          // Load SoundFont instruments if needed
          const soundFontReady = await loadSoundFontInstruments();

          if (soundFontReady) {
            // Create an array of promises for each part
            const promises = [];

            // Play melody with SoundFont
            if (melodyNotes.length > 0 && melodyInstrumentRef.current) {
              promises.push(
                playMelodyWithSoundFont(melodyInstrumentRef.current, melodyNotes, tempo)
              );
            }

            // Play chords with SoundFont
            if (chords.length > 0 && chordInstrumentRef.current) {
              promises.push(
                playChordProgressionWithSoundFont(chordInstrumentRef.current, chords, tempo)
              );
            }

            // Play bass with SoundFont
            if (bassNotes.length > 0 && bassInstrumentRef.current) {
              promises.push(playMelodyWithSoundFont(bassInstrumentRef.current, bassNotes, tempo));
            }

            // Wait for all parts to finish playing
            if (promises.length > 0) {
              await Promise.all(promises);
              setIsPlaying(false);
              setActivePlayingPart(null);
              return;
            }
          }
        } catch (soundFontError) {
          console.error('Error playing with SoundFont:', soundFontError);
          // Fall back to Tone.js
        }
      }

      // Fall back to Tone.js
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        setIsPlaying(false);
        setActivePlayingPart(null);
        return;
      }

      Tone.Transport.bpm.value = tempo;

      // Create synths lazily if they don't exist
      if (!melodySynthRef.current) {
        melodySynthRef.current = await createSynth('melody');
        if (!melodySynthRef.current) {
          console.error('Failed to create melody synth');
          setIsPlaying(false);
          setActivePlayingPart(null);
          return;
        }
      }

      if (!chordSynthRef.current) {
        chordSynthRef.current = await createSynth('chord');
        if (!chordSynthRef.current) {
          console.error('Failed to create chord synth');
          setIsPlaying(false);
          setActivePlayingPart(null);
          return;
        }
      }

      if (!bassSynthRef.current) {
        bassSynthRef.current = await createSynth('bass');
        if (!bassSynthRef.current) {
          console.error('Failed to create bass synth');
          setIsPlaying(false);
          setActivePlayingPart(null);
          return;
        }
      }

      const now = Tone.now();
      const secondsPerBar = (60 / tempo) * 4; // 4 beats per bar

      // Play melody
      if (melodyNotes.length > 0) {
        melodyNotes.forEach(note => {
          const durationSeconds = (note.duration * 60) / tempo;
          const startTime = now + (note.startTime * 60) / tempo;

          melodySynthRef.current.triggerAttackRelease(
            note.pitch,
            durationSeconds,
            startTime,
            note.velocity
          );
        });
      }

      // Play chords
      if (chords.length > 0) {
        chords.forEach(chord => {
          const startTime = now + chord.position * secondsPerBar;
          const duration = chord.duration * secondsPerBar;

          chordSynthRef.current.triggerAttackRelease(chord.notes, duration, startTime);
        });
      }

      // Play bass
      if (bassNotes.length > 0) {
        bassNotes.forEach(note => {
          const durationSeconds = (note.duration * 60) / tempo;
          const startTime = now + (note.startTime * 60) / tempo;

          bassSynthRef.current.triggerAttackRelease(
            note.pitch,
            durationSeconds,
            startTime,
            note.velocity
          );
        });
      }

      // Calculate when playback will end
      let lastTime = 0;

      // Check melody end time
      if (melodyNotes.length > 0) {
        const melodyEndTime = melodyNotes.reduce((latest, note) => {
          const endTime = note.startTime + note.duration;
          return endTime > latest ? endTime : latest;
        }, 0);

        lastTime = Math.max(lastTime, melodyEndTime);
      }

      // Check chord end time
      if (chords.length > 0) {
        const chordEndTime =
          chords.reduce((latest, chord) => {
            const endPosition = chord.position + chord.duration;
            return endPosition > latest ? endPosition : latest;
          }, 0) * 4; // Convert from bars to beats

        lastTime = Math.max(lastTime, chordEndTime);
      }

      // Check bass end time
      if (bassNotes.length > 0) {
        const bassEndTime = bassNotes.reduce((latest, note) => {
          const endTime = note.startTime + note.duration;
          return endTime > latest ? endTime : latest;
        }, 0);

        lastTime = Math.max(lastTime, bassEndTime);
      }

      const playbackDuration = (lastTime * 60) / tempo;

      // Automatically stop playing after the composition finishes
      setTimeout(
        () => {
          setIsPlaying(false);
          setActivePlayingPart(null);
        },
        playbackDuration * 1000 + 500
      ); // Add a small buffer
    } catch (error) {
      console.error('Error playing composition:', error);
      setIsPlaying(false);
      setActivePlayingPart(null);
    }
  };

  // Play data based on type
  const playData = async (data, type) => {
    if (!data) return;

    try {
      switch (type) {
        case 'melody':
          await playMelody(data.notes, data.tempo);
          break;
        case 'chord':
          await playChords(data.progression, data.tempo);
          break;
        case 'composition':
          await playComposition(data, data.tempo || 120);
          break;
        default:
          console.error('Unknown data type:', type);
      }
    } catch (error) {
      console.error('Error playing data:', error);
      stopPlayback();
    }
  };

  return (
    <PlaybackContext.Provider
      value={{
        isPlaying,
        activePlayingPart,
        useSoundFont,
        setUseSoundFont,
        instrumentsLoading,
        melodyInstrument,
        chordInstrument,
        bassInstrument,
        setMelodyInstrument,
        setChordInstrument,
        setBassInstrument,
        loadInstruments,
        playMelody,
        playChords,
        playBass,
        playComposition,
        playData,
        stopPlayback,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}

/**
 * Hook to use the playback context
 */
export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}
