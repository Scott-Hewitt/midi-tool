import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
  Tooltip,
  HStack,
  VStack,
  Badge,
  useTheme
} from '@chakra-ui/react';
import PlayButton from './PlayButton';
import InstrumentSelector from './InstrumentSelector';
import { usePlayback } from '../utils/PlaybackContext';

function Visualisation({ data, type }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const {
    useSoundFont,
    setUseSoundFont,
    melodyInstrument,
    chordInstrument,
    bassInstrument,
    setMelodyInstrument,
    setChordInstrument,
    setBassInstrument,
    instrumentsLoading
  } = usePlayback();

  const handleInstrumentChange = (instrumentType, value) => {
    switch (instrumentType) {
      case 'melody':
        setMelodyInstrument(value);
        break;
      case 'chord':
        setChordInstrument(value);
        break;
      case 'bass':
        setBassInstrument(value);
        break;
      default:
        break;
    }
  };
  const [hoveredNote, setHoveredNote] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dpr, setDpr] = useState(window.devicePixelRatio || 1);
  const theme = useTheme();

  const PIANO_KEY_WIDTH = 40;
  const WHITE_KEY_HEIGHT = 20;
  const BLACK_KEY_HEIGHT = 12;
  const NOTE_HEIGHT = 16;
  const HEADER_HEIGHT = 30;

  // Handle mouse movement over the canvas
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate mouse position relative to the canvas, accounting for CSS scaling
    const scaleX = canvas.width / rect.width / dpr;
    const scaleY = canvas.height / rect.height / dpr;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Check if mouse is over a note
    if (type === 'melody' && data.notes) {
      const hovered = data.notes.find(note => {
        if (!note.visualData) return false;
        const { x: noteX, y: noteY, width: noteWidth, height: noteHeight } = note.visualData;
        return x >= noteX && x <= noteX + noteWidth && y >= noteY && y <= noteY + noteHeight;
      });

      setHoveredNote(hovered);
    } else if (type === 'chord' && data.progression) {
      // For chord data, we need to check each note in each chord
      let foundNote = null;

      data.progression.forEach(chord => {
        if (!chord.visualData) return;

        chord.visualData.forEach(noteData => {
          if (x >= noteData.x && x <= noteData.x + noteData.width &&
              y >= noteData.y && y <= noteData.y + noteData.height) {
            foundNote = {
              ...noteData,
              chord: chord
            };
          }
        });
      });

      setHoveredNote(foundNote);
    } else if (type === 'composition' && data) {
      // For composition data, we need to check melody, chord, and bass notes
      let foundNote = null;

      // Check melody notes
      if (data.melody && data.melody.notes) {
        data.melody.notes.forEach(note => {
          if (!note.visualData) return;
          const { x: noteX, y: noteY, width: noteWidth, height: noteHeight } = note.visualData;
          if (x >= noteX && x <= noteX + noteWidth && y >= noteY && y <= noteY + noteHeight) {
            foundNote = {
              ...note,
              part: 'melody',
              instrument: data.melody.instrument
            };
          }
        });
      }

      // Check chord notes
      if (!foundNote && data.chord && data.chord.progression) {
        data.chord.progression.forEach(chord => {
          if (!chord.visualData) return;

          chord.visualData.forEach(noteData => {
            if (x >= noteData.x && x <= noteData.x + noteData.width &&
                y >= noteData.y && y <= noteData.y + noteData.height) {
              foundNote = {
                ...noteData,
                chord: chord,
                part: 'chord',
                instrument: data.chord.instrument
              };
            }
          });
        });
      }

      // Check bass notes
      if (!foundNote && data.bass && data.bass.notes) {
        data.bass.notes.forEach(note => {
          if (!note.visualData) return;
          const { x: noteX, y: noteY, width: noteWidth, height: noteHeight } = note.visualData;
          if (x >= noteX && x <= noteX + noteWidth && y >= noteY && y <= noteY + noteHeight) {
            foundNote = {
              ...note,
              part: 'bass',
              instrument: data.bass.instrument
            };
          }
        });
      }

      setHoveredNote(foundNote);
    }
  };

  // Handle mouse leaving the canvas
  const handleMouseLeave = () => {
    setHoveredNote(null);
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ASPECT_RATIO = 2;

    let resizeTimeout = null;
    let lastWidth = 0;
    let lastHeight = 0;

    const updateCanvasSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const { width } = container.getBoundingClientRect();

      // Maintain fixed aspect ratio
      const height = width / ASPECT_RATIO;

      // Only update if the size has changed significantly (more than 1px)
      if (
        Math.abs(width - lastWidth) > 1 ||
        Math.abs(height - lastHeight) > 1
      ) {
        lastWidth = width;
        lastHeight = height;

        // Update state in a way that doesn't cause unnecessary re-renders
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(updateCanvasSize, 100);
    });

    resizeObserver.observe(containerRef.current);

    const updateDpr = () => {
      setDpr(window.devicePixelRatio || 1);
    };

    window.addEventListener('resize', updateDpr);

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }

      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDpr);
    };
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const physicalWidth = Math.floor(canvasSize.width * dpr);
    const physicalHeight = Math.floor(canvasSize.height * dpr);

    // Only update dimensions if they've actually changed
    if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;

      // Set the CSS dimensions of the canvas
      canvas.style.width = `${canvasSize.width}px`;
      canvas.style.height = `${canvasSize.height}px`;
    }

    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    if (type === 'melody') {
      drawMelody(ctx, data, canvasSize.width, canvasSize.height);
    } else if (type === 'chord') {
      drawChordProgression(ctx, data, canvasSize.width, canvasSize.height);
    } else if (type === 'composition') {
      drawComposition(ctx, data, canvasSize.width, canvasSize.height);
    }

    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [data, type, canvasSize, dpr]);

  const drawMelody = (ctx, melody, width, height) => {
    if (!melody || !melody.notes || melody.notes.length === 0) return;

    const notes = melody.notes;
    const totalDuration = notes.reduce((sum, note) => Math.max(sum, note.startTime + note.duration), 0);

    const pianoRollWidth = width - PIANO_KEY_WIDTH;
    const timeScale = pianoRollWidth / totalDuration;

    let highestNote = -Infinity;
    let lowestNote = Infinity;

    notes.forEach(note => {
      // Convert note name to MIDI number for comparison
      const midiNumber = noteNameToMidiNumber(note.pitch);
      highestNote = Math.max(highestNote, midiNumber);
      lowestNote = Math.min(lowestNote, midiNumber);
    });

    highestNote += 2;
    lowestNote = Math.max(0, lowestNote - 2);

    const noteRange = highestNote - lowestNote;
    const contentHeight = height - HEADER_HEIGHT;
    const noteScale = contentHeight / (noteRange || 1);

    const bgColor = theme.colors.gray[900];
    const headerColor = theme.colors.gray[800];
    const textColor = theme.colors.gray[100];
    const primaryColor = theme.colors.primary[500];
    const secondaryColor = theme.colors.secondary[500];

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, width, HEADER_HEIGHT);

    // Draw time markers in header
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    const beatsPerBar = 4; // Assuming 4/4 time
    const barWidth = beatsPerBar * timeScale;
    const totalBars = Math.ceil(totalDuration / beatsPerBar);

    for (let i = 0; i <= totalBars; i++) {
      const x = PIANO_KEY_WIDTH + (i * barWidth);

      // Draw bar number
      ctx.fillText(`${i+1}`, x, HEADER_HEIGHT - 10);

      // Draw bar line
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = i % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw beat lines within each bar
      if (i < totalBars) {
        for (let beat = 1; beat < beatsPerBar; beat++) {
          const beatX = x + (beat * timeScale);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(beatX, HEADER_HEIGHT);
          ctx.lineTo(beatX, height);
          ctx.stroke();
        }
      }
    }

    // Draw piano keys
    const keyHeight = noteScale;
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    for (let i = lowestNote; i <= highestNote; i++) {
      const note = i % 12;
      const octave = Math.floor(i / 12) - 1;
      const isBlackKey = [1, 3, 6, 8, 10].includes(note);
      const y = height - ((i - lowestNote) * keyHeight) - keyHeight;

      // Draw key background
      if (isBlackKey) {
        ctx.fillStyle = 'rgba(30, 30, 40, 0.9)';
      } else {
        ctx.fillStyle = 'rgba(50, 50, 65, 0.8)';
      }

      ctx.fillRect(0, y, PIANO_KEY_WIDTH, keyHeight);

      // Draw key border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, PIANO_KEY_WIDTH, keyHeight);

      // Draw note name (only for C notes to avoid clutter)
      if (note === 0) {
        ctx.fillStyle = textColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`C${octave}`, 5, y + keyHeight - 5);
      }

      // Draw horizontal grid lines
      ctx.strokeStyle = note === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = note === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(PIANO_KEY_WIDTH, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw notes
    notes.forEach((note, index) => {
      const midiNumber = noteNameToMidiNumber(note.pitch);
      const x = PIANO_KEY_WIDTH + (note.startTime * timeScale);
      const noteWidth = Math.max(note.duration * timeScale, 5); // Minimum width for visibility
      const y = height - ((midiNumber - lowestNote) * keyHeight) - keyHeight;

      // Draw note rectangle with base color
      const noteColor = getColorForVelocity(note.velocity);
      ctx.fillStyle = noteColor;
      ctx.fillRect(x, y + 1, noteWidth, keyHeight - 2);

      // Add a subtle gradient to the note
      const noteGradient = ctx.createLinearGradient(0, y, 0, y + keyHeight);
      noteGradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
      noteGradient.addColorStop(1, `rgba(0, 0, 0, 0.1)`);
      ctx.fillStyle = noteGradient;
      ctx.fillRect(x, y + 1, noteWidth, keyHeight - 2);

      // Draw note border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y + 1, noteWidth, keyHeight - 2);

      // Draw note name if there's enough space
      if (noteWidth > 30) {
        // Determine text color based on background brightness
        const rgbMatch = noteColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        let textColor = '#000000';
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          // Simple brightness formula
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          textColor = brightness > 128 ? '#000000' : '#ffffff';
        }

        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(note.pitch, x + (noteWidth / 2), y + (keyHeight / 2) + 3);
      }

      // Store note data for hover interaction
      note.visualData = {
        x, y, width: noteWidth, height: keyHeight, index
      };
    });

    // Draw info overlay with gradient
    const infoGradient = ctx.createLinearGradient(PIANO_KEY_WIDTH + 10, height - 30, PIANO_KEY_WIDTH + 10, height - 5);
    infoGradient.addColorStop(0, `rgba(${hexToRgb(theme.colors.gray[900])}, 0.9)`);
    infoGradient.addColorStop(1, `rgba(${hexToRgb(theme.colors.gray[800])}, 0.9)`);
    ctx.fillStyle = infoGradient;
    ctx.fillRect(PIANO_KEY_WIDTH + 10, height - 30, 300, 25);

    // Add a subtle border to the info overlay
    ctx.strokeStyle = `rgba(${hexToRgb(primaryColor)}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(PIANO_KEY_WIDTH + 10, height - 30, 300, 25);

    // Draw info text
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Scale: ${melody.scale} | Tempo: ${melody.tempo} BPM | Notes: ${notes.length}`, PIANO_KEY_WIDTH + 20, height - 15);
  };

  const drawComposition = (ctx, composition, width, height) => {
    if (!composition) return;

    // Extract data
    const melodyNotes = composition.melody?.notes || [];
    const chords = composition.chord?.progression || [];
    const bassNotes = composition.bass?.notes || [];

    // Calculate total duration
    const melodyDuration = melodyNotes.length > 0
      ? melodyNotes.reduce((max, note) => Math.max(max, note.startTime + note.duration), 0)
      : 0;

    const chordDuration = chords.length > 0
      ? chords.reduce((sum, chord) => sum + chord.duration * 4, 0) // Convert from bars to beats
      : 0;

    const bassDuration = bassNotes.length > 0
      ? bassNotes.reduce((max, note) => Math.max(max, note.startTime + note.duration), 0)
      : 0;

    const totalDuration = Math.max(melodyDuration, chordDuration, bassDuration);

    // If no data, return
    if (totalDuration === 0) return;

    // Calculate the available width for the piano roll (excluding piano keys)
    const pianoRollWidth = width - PIANO_KEY_WIDTH;
    const timeScale = pianoRollWidth / totalDuration;

    // Find the highest and lowest notes across all parts for scaling
    let highestNote = -Infinity;
    let lowestNote = Infinity;

    // Check melody notes
    melodyNotes.forEach(note => {
      const midiNumber = noteNameToMidiNumber(note.pitch);
      highestNote = Math.max(highestNote, midiNumber);
      lowestNote = Math.min(lowestNote, midiNumber);
    });

    // Check chord notes
    chords.forEach(chord => {
      chord.notes.forEach(note => {
        const midiNumber = noteNameToMidiNumber(note);
        highestNote = Math.max(highestNote, midiNumber);
        lowestNote = Math.min(lowestNote, midiNumber);
      });
    });

    // Check bass notes
    bassNotes.forEach(note => {
      const midiNumber = noteNameToMidiNumber(note.pitch);
      highestNote = Math.max(highestNote, midiNumber);
      lowestNote = Math.min(lowestNote, midiNumber);
    });

    // Add padding to note range
    highestNote += 2;
    lowestNote = Math.max(0, lowestNote - 2);

    const noteRange = highestNote - lowestNote;
    const contentHeight = height - HEADER_HEIGHT;
    const keyHeight = contentHeight / (noteRange || 1); // Avoid division by zero

    // Get theme colors
    const bgColor = theme.colors.gray[900];
    const headerColor = theme.colors.gray[800];
    const textColor = theme.colors.gray[100];
    const primaryColor = theme.colors.primary[500];
    const secondaryColor = theme.colors.secondary[500];
    const accentColor = theme.colors.accent ? theme.colors.accent[500] : '#f59e0b';

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw header area
    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, width, HEADER_HEIGHT);

    // Draw time markers in header
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    const beatsPerBar = 4; // Assuming 4/4 time
    const barWidth = beatsPerBar * timeScale;
    const totalBars = Math.ceil(totalDuration / beatsPerBar);

    for (let i = 0; i <= totalBars; i++) {
      const x = PIANO_KEY_WIDTH + (i * barWidth);

      // Draw bar number
      ctx.fillText(`${i+1}`, x, HEADER_HEIGHT - 10);

      // Draw bar line
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = i % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw beat lines within each bar
      if (i < totalBars) {
        for (let beat = 1; beat < beatsPerBar; beat++) {
          const beatX = x + (beat * timeScale);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(beatX, HEADER_HEIGHT);
          ctx.lineTo(beatX, height);
          ctx.stroke();
        }
      }
    }

    // Draw piano keys
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    for (let i = lowestNote; i <= highestNote; i++) {
      const note = i % 12;
      const octave = Math.floor(i / 12) - 1;
      const isBlackKey = [1, 3, 6, 8, 10].includes(note);
      const y = height - ((i - lowestNote) * keyHeight) - keyHeight;

      // Draw key background
      if (isBlackKey) {
        ctx.fillStyle = 'rgba(30, 30, 40, 0.9)';
      } else {
        ctx.fillStyle = 'rgba(50, 50, 65, 0.8)';
      }

      ctx.fillRect(0, y, PIANO_KEY_WIDTH, keyHeight);

      // Draw key border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, PIANO_KEY_WIDTH, keyHeight);

      // Draw note name (only for C notes to avoid clutter)
      if (note === 0) {
        ctx.fillStyle = textColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`C${octave}`, 5, y + keyHeight - 5);
      }

      // Draw horizontal grid lines
      ctx.strokeStyle = note === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = note === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(PIANO_KEY_WIDTH, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw chord blocks
    chords.forEach((chord, chordIndex) => {
      const chordDuration = chord.duration * 4; // Convert from bars to beats
      const chordStartX = PIANO_KEY_WIDTH + (chord.position * 4 * timeScale); // Convert position from bars to beats
      const chordWidth = chordDuration * timeScale;

      // Draw chord label at the top
      const chordLabelBg = `rgba(${hexToRgb(primaryColor)}, 0.2)`;
      ctx.fillStyle = chordLabelBg;
      ctx.fillRect(chordStartX, HEADER_HEIGHT, chordWidth, 20);

      // Add a subtle gradient to the chord label
      const gradient = ctx.createLinearGradient(chordStartX, HEADER_HEIGHT, chordStartX, HEADER_HEIGHT + 20);
      gradient.addColorStop(0, `rgba(${hexToRgb(primaryColor)}, 0.3)`);
      gradient.addColorStop(1, `rgba(${hexToRgb(primaryColor)}, 0.1)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(chordStartX, HEADER_HEIGHT, chordWidth, 20);

      // Draw chord name with a subtle text shadow
      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';

      // Text shadow effect - enhanced for better readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(`${chord.symbol || chord.root.slice(0, -1) + chord.type} (${chord.degree})`,
                  chordStartX + (chordWidth / 2), HEADER_HEIGHT + 14);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw each note in the chord
      chord.notes.forEach((note, noteIndex) => {
        const midiNumber = noteNameToMidiNumber(note);
        const y = height - ((midiNumber - lowestNote) * keyHeight) - keyHeight;

        // Draw note rectangle with a gradient
        const noteColor = `rgba(${hexToRgb(secondaryColor)}, 0.7)`;
        ctx.fillStyle = noteColor;
        ctx.fillRect(chordStartX + 2, y + 1, chordWidth - 4, keyHeight - 2);

        // Add a subtle gradient to the note
        const noteGradient = ctx.createLinearGradient(0, y, 0, y + keyHeight);
        noteGradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        noteGradient.addColorStop(1, `rgba(0, 0, 0, 0.1)`);
        ctx.fillStyle = noteGradient;
        ctx.fillRect(chordStartX + 2, y + 1, chordWidth - 4, keyHeight - 2);

        // Draw note border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(chordStartX + 2, y + 1, chordWidth - 4, keyHeight - 2);

        // Draw note name if there's enough space
        if (chordWidth > 30) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(note, chordStartX + (chordWidth / 2), y + (keyHeight / 2) + 3);
        }

        // Store note data for hover interaction
        if (!chord.visualData) chord.visualData = [];
        chord.visualData.push({
          x: chordStartX + 2,
          y: y + 1,
          width: chordWidth - 4,
          height: keyHeight - 2,
          note: note,
          chordIndex: chordIndex,
          noteIndex: noteIndex
        });
      });
    });

    // Draw melody notes
    melodyNotes.forEach((note, index) => {
      const midiNumber = noteNameToMidiNumber(note.pitch);
      const x = PIANO_KEY_WIDTH + (note.startTime * timeScale);
      const noteWidth = Math.max(note.duration * timeScale, 5); // Minimum width for visibility
      const y = height - ((midiNumber - lowestNote) * keyHeight) - keyHeight;

      // Draw note rectangle with base color
      const noteColor = `rgba(${hexToRgb(primaryColor)}, ${note.velocity})`;
      ctx.fillStyle = noteColor;
      ctx.fillRect(x, y + 1, noteWidth, keyHeight - 2);

      // Add a subtle gradient to the note
      const noteGradient = ctx.createLinearGradient(0, y, 0, y + keyHeight);
      noteGradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
      noteGradient.addColorStop(1, `rgba(0, 0, 0, 0.1)`);
      ctx.fillStyle = noteGradient;
      ctx.fillRect(x, y + 1, noteWidth, keyHeight - 2);

      // Draw note border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y + 1, noteWidth, keyHeight - 2);

      // Draw note name if there's enough space
      if (noteWidth > 30) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(note.pitch, x + (noteWidth / 2), y + (keyHeight / 2) + 3);
      }

      // Store note data for hover interaction
      note.visualData = {
        x, y, width: noteWidth, height: keyHeight, index
      };
    });

    // Draw bass notes
    bassNotes.forEach((note, index) => {
      const midiNumber = noteNameToMidiNumber(note.pitch);
      const x = PIANO_KEY_WIDTH + (note.startTime * timeScale);
      const noteWidth = Math.max(note.duration * timeScale, 5); // Minimum width for visibility
      const y = height - ((midiNumber - lowestNote) * keyHeight) - keyHeight;

      // Draw note rectangle with base color
      const noteColor = `rgba(${hexToRgb(accentColor)}, ${note.velocity})`;
      ctx.fillStyle = noteColor;
      ctx.fillRect(x, y + 1, noteWidth, keyHeight - 2);

      // Add a subtle gradient to the note
      const noteGradient = ctx.createLinearGradient(0, y, 0, y + keyHeight);
      noteGradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
      noteGradient.addColorStop(1, `rgba(0, 0, 0, 0.1)`);
      ctx.fillStyle = noteGradient;
      ctx.fillRect(x, y + 1, noteWidth, keyHeight - 2);

      // Draw note border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y + 1, noteWidth, keyHeight - 2);

      // Draw note name if there's enough space
      if (noteWidth > 30) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(note.pitch, x + (noteWidth / 2), y + (keyHeight / 2) + 3);
      }

      // Store note data for hover interaction
      note.visualData = {
        x, y, width: noteWidth, height: keyHeight, index
      };
    });

    // Draw info overlay
    const infoGradient = ctx.createLinearGradient(PIANO_KEY_WIDTH + 10, height - 30, PIANO_KEY_WIDTH + 10, height - 5);
    infoGradient.addColorStop(0, `rgba(${hexToRgb(theme.colors.gray[900])}, 0.9)`);
    infoGradient.addColorStop(1, `rgba(${hexToRgb(theme.colors.gray[800])}, 0.9)`);
    ctx.fillStyle = infoGradient;
    ctx.fillRect(PIANO_KEY_WIDTH + 10, height - 30, 400, 25);

    // Add a subtle border to the info overlay
    ctx.strokeStyle = `rgba(${hexToRgb(primaryColor)}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(PIANO_KEY_WIDTH + 10, height - 30, 400, 25);

    // Draw info text
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Key: ${composition.key} | Tempo: ${composition.tempo} BPM | Melody: ${melodyNotes.length} notes | Chords: ${chords.length} | Bass: ${bassNotes.length} notes`, PIANO_KEY_WIDTH + 20, height - 15);
  };

  // Draw a chord progression visualization as a DAW piano roll
  const drawChordProgression = (ctx, progression, width, height) => {
    if (!progression || !progression.progression || progression.progression.length === 0) return;

    const chords = progression.progression;
    const totalDuration = chords.reduce((sum, chord) => sum + chord.duration * 4, 0); // Convert from bars to beats

    // Calculate the available width for the piano roll (excluding piano keys)
    const pianoRollWidth = width - PIANO_KEY_WIDTH;
    const timeScale = pianoRollWidth / totalDuration;

    // Find the highest and lowest notes across all chords for scaling
    let highestNote = -Infinity;
    let lowestNote = Infinity;

    chords.forEach(chord => {
      chord.notes.forEach(note => {
        const midiNumber = noteNameToMidiNumber(note);
        highestNote = Math.max(highestNote, midiNumber);
        lowestNote = Math.min(lowestNote, midiNumber);
      });
    });

    // Add padding to note range
    highestNote += 2;
    lowestNote = Math.max(0, lowestNote - 2);

    const noteRange = highestNote - lowestNote;
    const contentHeight = height - HEADER_HEIGHT;
    const keyHeight = contentHeight / (noteRange || 1); // Avoid division by zero

    // Get theme colors
    const bgColor = theme.colors.gray[900];
    const headerColor = theme.colors.gray[800];
    const textColor = theme.colors.gray[100];
    const primaryColor = theme.colors.primary[500];
    const secondaryColor = theme.colors.secondary[500];

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw header area
    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, width, HEADER_HEIGHT);

    // Draw time markers in header
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    const beatsPerBar = 4; // Assuming 4/4 time
    const barWidth = beatsPerBar * timeScale;
    const totalBars = Math.ceil(totalDuration / beatsPerBar);

    for (let i = 0; i <= totalBars; i++) {
      const x = PIANO_KEY_WIDTH + (i * barWidth);

      // Draw bar number
      ctx.fillText(`${i+1}`, x, HEADER_HEIGHT - 10);

      // Draw bar line
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = i % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw beat lines within each bar
      if (i < totalBars) {
        for (let beat = 1; beat < beatsPerBar; beat++) {
          const beatX = x + (beat * timeScale);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(beatX, HEADER_HEIGHT);
          ctx.lineTo(beatX, height);
          ctx.stroke();
        }
      }
    }

    // Draw piano keys
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    for (let i = lowestNote; i <= highestNote; i++) {
      const note = i % 12;
      const octave = Math.floor(i / 12) - 1;
      const isBlackKey = [1, 3, 6, 8, 10].includes(note);
      const y = height - ((i - lowestNote) * keyHeight) - keyHeight;

      // Draw key background
      if (isBlackKey) {
        ctx.fillStyle = 'rgba(30, 30, 40, 0.9)';
      } else {
        ctx.fillStyle = 'rgba(50, 50, 65, 0.8)';
      }

      ctx.fillRect(0, y, PIANO_KEY_WIDTH, keyHeight);

      // Draw key border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, PIANO_KEY_WIDTH, keyHeight);

      // Draw note name (only for C notes to avoid clutter)
      if (note === 0) {
        ctx.fillStyle = textColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`C${octave}`, 5, y + keyHeight - 5);
      }

      // Draw horizontal grid lines
      ctx.strokeStyle = note === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = note === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(PIANO_KEY_WIDTH, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw chord blocks and notes
    let currentBeat = 0;

    chords.forEach((chord, chordIndex) => {
      const chordDuration = chord.duration * 4; // Convert from bars to beats
      const chordStartX = PIANO_KEY_WIDTH + (currentBeat * timeScale);
      const chordWidth = chordDuration * timeScale;

      // Draw chord label at the top
      const chordLabelBg = `rgba(${hexToRgb(primaryColor)}, 0.2)`;
      ctx.fillStyle = chordLabelBg;
      ctx.fillRect(chordStartX, HEADER_HEIGHT, chordWidth, 20);

      // Add a subtle gradient to the chord label
      const gradient = ctx.createLinearGradient(chordStartX, HEADER_HEIGHT, chordStartX, HEADER_HEIGHT + 20);
      gradient.addColorStop(0, `rgba(${hexToRgb(primaryColor)}, 0.3)`);
      gradient.addColorStop(1, `rgba(${hexToRgb(primaryColor)}, 0.1)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(chordStartX, HEADER_HEIGHT, chordWidth, 20);

      // Draw chord name with a subtle text shadow
      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';

      // Text shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(`${chord.symbol || chord.root.slice(0, -1) + chord.type} (${chord.degree})`,
                  chordStartX + (chordWidth / 2), HEADER_HEIGHT + 14);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw vertical chord boundary
      ctx.strokeStyle = `rgba(${hexToRgb(primaryColor)}, 0.4)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(chordStartX, HEADER_HEIGHT);
      ctx.lineTo(chordStartX, height);
      ctx.stroke();

      // Draw each note in the chord
      chord.notes.forEach((note, noteIndex) => {
        const midiNumber = noteNameToMidiNumber(note);
        const y = height - ((midiNumber - lowestNote) * keyHeight) - keyHeight;

        // Draw note rectangle with a gradient
        const noteColor = getColorForChord(chord.type, 0.8 + (noteIndex * 0.05));
        ctx.fillStyle = noteColor;
        ctx.fillRect(chordStartX + 2, y + 1, chordWidth - 4, keyHeight - 2);

        // Add a subtle gradient to the note
        const noteGradient = ctx.createLinearGradient(0, y, 0, y + keyHeight);
        noteGradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        noteGradient.addColorStop(1, `rgba(0, 0, 0, 0.1)`);
        ctx.fillStyle = noteGradient;
        ctx.fillRect(chordStartX + 2, y + 1, chordWidth - 4, keyHeight - 2);

        // Draw note border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(chordStartX + 2, y + 1, chordWidth - 4, keyHeight - 2);

        // Draw note name if there's enough space
        if (chordWidth > 30) {
          // Determine text color based on background brightness
          const rgbMatch = noteColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          let textColor = '#000000';
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            // Simple brightness formula
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            textColor = brightness > 128 ? '#000000' : '#ffffff';
          }

          // Add text shadow for better readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          ctx.fillStyle = textColor;
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(note, chordStartX + (chordWidth / 2), y + (keyHeight / 2) + 3);

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Store note data for hover interaction
        if (!chord.visualData) chord.visualData = [];
        chord.visualData.push({
          x: chordStartX + 2,
          y: y + 1,
          width: chordWidth - 4,
          height: keyHeight - 2,
          note: note,
          chordIndex: chordIndex,
          noteIndex: noteIndex
        });
      });

      currentBeat += chordDuration;
    });

    // Draw info overlay
    const infoGradient = ctx.createLinearGradient(PIANO_KEY_WIDTH + 10, height - 30, PIANO_KEY_WIDTH + 10, height - 5);
    infoGradient.addColorStop(0, `rgba(${hexToRgb(theme.colors.gray[900])}, 0.9)`);
    infoGradient.addColorStop(1, `rgba(${hexToRgb(theme.colors.gray[800])}, 0.9)`);
    ctx.fillStyle = infoGradient;
    ctx.fillRect(PIANO_KEY_WIDTH + 10, height - 30, 300, 25);

    // Add a subtle border to the info overlay
    ctx.strokeStyle = `rgba(${hexToRgb(primaryColor)}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(PIANO_KEY_WIDTH + 10, height - 30, 300, 25);

    // Draw info text
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Key: ${progression.key} | Chords: ${chords.length} | Duration: ${totalBars} bars`, PIANO_KEY_WIDTH + 20, height - 15);
  };

  // Helper function to convert note name to MIDI number
  const noteNameToMidiNumber = (noteName) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = noteName.slice(0, -1);
    const octave = parseInt(noteName.slice(-1));
    return notes.indexOf(note) + (octave + 1) * 12;
  };

  // Helper function to get color based on velocity
  const getColorForVelocity = (velocity, alpha = 1.0) => {
    // Normalize velocity to 0-1 range if it's in MIDI range (0-127)
    const normalizedVelocity = velocity > 1 ? velocity / 127 : velocity;

    // Use theme colors for a gradient based on velocity
    const primaryColor = theme.colors.primary;
    const secondaryColor = theme.colors.secondary;
    const accentColor = theme.colors.accent;

    // Extract RGB components from hex colors
    const extractRGB = (hexColor) => {
      const hex = hexColor.replace('#', '');
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    };

    // Interpolate between colors based on velocity
    let r, g, b;
    if (normalizedVelocity < 0.5) {
      // Interpolate from primary to secondary
      const primary = extractRGB(primaryColor[400]);
      const secondary = extractRGB(secondaryColor[400]);
      const t = normalizedVelocity * 2; // Scale to 0-1 range
      r = Math.floor(primary.r + (secondary.r - primary.r) * t);
      g = Math.floor(primary.g + (secondary.g - primary.g) * t);
      b = Math.floor(primary.b + (secondary.b - primary.b) * t);
    } else {
      // Interpolate from secondary to accent
      const secondary = extractRGB(secondaryColor[400]);
      const accent = extractRGB(accentColor[400]);
      const t = (normalizedVelocity - 0.5) * 2; // Scale to 0-1 range
      r = Math.floor(secondary.r + (accent.r - secondary.r) * t);
      g = Math.floor(secondary.g + (accent.g - secondary.g) * t);
      b = Math.floor(secondary.b + (accent.b - secondary.b) * t);
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper function to get color based on chord type
  const getColorForChord = (chordType, alpha = 0.7) => {
    // Use theme colors for different chord types
    const colors = {
      'maj': `rgba(${hexToRgb(theme.colors.primary[400])}, ${alpha})`,
      'min': `rgba(${hexToRgb(theme.colors.secondary[400])}, ${alpha})`,
      '7': `rgba(${hexToRgb(theme.colors.accent[400])}, ${alpha})`,
      'maj7': `rgba(${hexToRgb(theme.colors.primary[600])}, ${alpha})`,
      'min7': `rgba(${hexToRgb(theme.colors.secondary[600])}, ${alpha})`,
      'dim': `rgba(${hexToRgb(theme.colors.error ? theme.colors.error[500] : '#ef4444')}, ${alpha})`,
      'aug': `rgba(${hexToRgb(theme.colors.accent[600])}, ${alpha})`,
      'sus4': `rgba(${hexToRgb(theme.colors.primary[300])}, ${alpha})`,
      'sus2': `rgba(${hexToRgb(theme.colors.secondary[300])}, ${alpha})`,
      '9': `rgba(${hexToRgb(theme.colors.accent[300])}, ${alpha})`,
      '11': `rgba(${hexToRgb(theme.colors.primary[500])}, ${alpha})`,
      '13': `rgba(${hexToRgb(theme.colors.secondary[500])}, ${alpha})`,
    };

    return colors[chordType] || `rgba(${hexToRgb(theme.colors.gray[400])}, ${alpha})`;
  };

  // Helper function to convert hex to rgb
  const hexToRgb = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Use a darker canvas background for dark mode
  const canvasBgColor = useColorModeValue('#f0f0f0', '#1A202C');
  const canvasBorderColor = useColorModeValue('#ddd', '#4A5568');

  // Render tooltip content based on hovered note
  const renderTooltipContent = () => {
    if (!hoveredNote) return null;

    if (type === 'melody') {
      return (
        <VStack align="start" spacing={1} p={2}>
          <HStack>
            <Badge colorScheme="blue">Note:</Badge>
            <Text>{hoveredNote.pitch}</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="green">Duration:</Badge>
            <Text>{hoveredNote.duration.toFixed(2)} beats</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="purple">Velocity:</Badge>
            <Text>{Math.round(hoveredNote.velocity * 100)}%</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="orange">Start Time:</Badge>
            <Text>{hoveredNote.startTime.toFixed(2)} beats</Text>
          </HStack>
        </VStack>
      );
    } else if (type === 'chord') {
      const chord = hoveredNote.chord;
      return (
        <VStack align="start" spacing={1} p={2}>
          <HStack>
            <Badge colorScheme="blue">Chord:</Badge>
            <Text>{chord.symbol || `${chord.root.slice(0, -1)}${chord.type}`} ({chord.degree})</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="green">Note:</Badge>
            <Text>{hoveredNote.note}</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="purple">Duration:</Badge>
            <Text>{chord.duration} bars</Text>
          </HStack>
          <HStack>
            <Badge colorScheme="orange">Position:</Badge>
            <Text>Bar {Math.floor(chord.position) + 1}</Text>
          </HStack>
        </VStack>
      );
    } else if (type === 'composition') {
      // For composition, we need to check which part the note belongs to
      if (hoveredNote.part === 'melody') {
        return (
          <VStack align="start" spacing={1} p={2}>
            <HStack>
              <Badge colorScheme="primary">Part:</Badge>
              <Text>Melody</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="blue">Note:</Badge>
              <Text>{hoveredNote.pitch}</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="green">Duration:</Badge>
              <Text>{hoveredNote.duration.toFixed(2)} beats</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="purple">Velocity:</Badge>
              <Text>{Math.round(hoveredNote.velocity * 100)}%</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="orange">Start Time:</Badge>
              <Text>{hoveredNote.startTime.toFixed(2)} beats</Text>
            </HStack>
            {hoveredNote.instrument && (
              <HStack>
                <Badge colorScheme="teal">Instrument:</Badge>
                <Text>{hoveredNote.instrument}</Text>
              </HStack>
            )}
          </VStack>
        );
      } else if (hoveredNote.part === 'chord') {
        const chord = hoveredNote.chord;
        return (
          <VStack align="start" spacing={1} p={2}>
            <HStack>
              <Badge colorScheme="secondary">Part:</Badge>
              <Text>Chord</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="blue">Chord:</Badge>
              <Text>{chord.symbol || `${chord.root.slice(0, -1)}${chord.type}`} ({chord.degree})</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="green">Note:</Badge>
              <Text>{hoveredNote.note}</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="purple">Duration:</Badge>
              <Text>{chord.duration} bars</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="orange">Position:</Badge>
              <Text>Bar {Math.floor(chord.position) + 1}</Text>
            </HStack>
            {hoveredNote.instrument && (
              <HStack>
                <Badge colorScheme="teal">Instrument:</Badge>
                <Text>{hoveredNote.instrument}</Text>
              </HStack>
            )}
          </VStack>
        );
      } else if (hoveredNote.part === 'bass') {
        return (
          <VStack align="start" spacing={1} p={2}>
            <HStack>
              <Badge colorScheme="accent">Part:</Badge>
              <Text>Bass</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="blue">Note:</Badge>
              <Text>{hoveredNote.pitch}</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="green">Duration:</Badge>
              <Text>{hoveredNote.duration.toFixed(2)} beats</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="purple">Velocity:</Badge>
              <Text>{Math.round(hoveredNote.velocity * 100)}%</Text>
            </HStack>
            <HStack>
              <Badge colorScheme="orange">Start Time:</Badge>
              <Text>{hoveredNote.startTime.toFixed(2)} beats</Text>
            </HStack>
            {hoveredNote.instrument && (
              <HStack>
                <Badge colorScheme="teal">Instrument:</Badge>
                <Text>{hoveredNote.instrument}</Text>
              </HStack>
            )}
          </VStack>
        );
      }
    }

    return null;
  };

  return (
    <Card p={6} variant="elevated" bg="rgba(30, 41, 59, 0.5)" backdropFilter="blur(12px)" border="1px solid rgba(255, 255, 255, 0.1)" boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)">
      <CardHeader pb={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="lg" color="primary.400">Piano Roll Visualization</Heading>
          <HStack spacing={2} position="relative" zIndex={2}>
            <InstrumentSelector
              type={type}
              useSoundFont={useSoundFont}
              setUseSoundFont={setUseSoundFont}
              melodyInstrument={melodyInstrument}
              chordInstrument={chordInstrument}
              bassInstrument={bassInstrument}
              onInstrumentChange={handleInstrumentChange}
              isLoading={instrumentsLoading}
            />
            <PlayButton data={data} type={type} />
          </HStack>
        </HStack>
      </CardHeader>

      <CardBody>
        <Box
          ref={containerRef}
          position="relative"
          width="100%"
          mb={4}
          borderRadius="md"
          overflow="hidden"
          boxShadow="lg"
          transition="box-shadow 0.3s ease"
          _hover={{ boxShadow: "xl" }}
          bg="rgba(15, 23, 42, 0.3)"
          p={2}
          border="1px solid"
          borderColor="rgba(99, 102, 241, 0.2)"
          style={{ maxWidth: '100%' }}
          zIndex={1}
        >
          {/* Canvas for piano roll */}
          <Box
            as="canvas"
            ref={canvasRef}
            borderRadius="md"
            display="block"
            width="100%"
            height="auto"
            boxShadow="inset 0 0 10px rgba(0, 0, 0, 0.2)"
            style={{
              aspectRatio: '2/1',
              maxWidth: '100%',
              objectFit: 'contain'
            }}
          />

          {/* Tooltip for hovered note */}
          {hoveredNote && (
            <Tooltip
              isOpen={true}
              label={renderTooltipContent()}
              placement="top"
              hasArrow
              bg={theme.colors.gray[800]}
              color={theme.colors.gray[100]}
              borderRadius="md"
              px={3}
              py={2}
              boxShadow="lg"
              border="1px solid"
              borderColor="rgba(99, 102, 241, 0.3)"
            >
              <Box
                position="absolute"
                left={mousePosition.x}
                top={mousePosition.y}
                width="1px"
                height="1px"
                pointerEvents="none"
              />
            </Tooltip>
          )}
        </Box>

        <Text
          fontSize="sm"
          color="gray.200"
          fontWeight="medium"
          mt={4}
          p={4}
          bg="rgba(255, 255, 255, 0.08)"
          borderRadius="md"
          borderLeft="4px solid"
          borderColor="primary.500"
          boxShadow="sm"
          lineHeight="1.6"
          textShadow="0 1px 2px rgba(0, 0, 0, 0.3)"
        >
          {type === 'melody'
            ? 'Piano Roll: Hover over notes to see details. Each rectangle represents a note. Height indicates pitch, width indicates duration, and color indicates velocity.'
            : 'Piano Roll: Hover over notes to see details. Each block represents a note in a chord. Colors indicate chord types.'}
        </Text>
      </CardBody>
    </Card>
  );
}

export default Visualisation;
