import { useRef, useEffect } from 'react';

function Visualization({ data, type }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!data || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    if (type === 'melody') {
      drawMelody(ctx, data, width, height);
    } else if (type === 'chord') {
      drawChordProgression(ctx, data, width, height);
    }
  }, [data, type]);
  
  // Draw a melody visualization
  const drawMelody = (ctx, melody, width, height) => {
    if (!melody || !melody.notes || melody.notes.length === 0) return;
    
    const notes = melody.notes;
    const totalDuration = notes.reduce((sum, note) => Math.max(sum, note.startTime + note.duration), 0);
    const timeScale = width / totalDuration;
    
    // Find the highest and lowest notes for scaling
    let highestNote = -Infinity;
    let lowestNote = Infinity;
    
    notes.forEach(note => {
      // Convert note name to MIDI number for comparison
      const midiNumber = noteNameToMidiNumber(note.pitch);
      highestNote = Math.max(highestNote, midiNumber);
      lowestNote = Math.min(lowestNote, midiNumber);
    });
    
    const noteRange = highestNote - lowestNote;
    const noteScale = (height - 40) / (noteRange || 1); // Avoid division by zero
    
    // Draw a piano roll style visualization
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (bars)
    const beatsPerBar = 4; // Assuming 4/4 time
    const barWidth = beatsPerBar * timeScale;
    
    for (let i = 0; i <= totalDuration / beatsPerBar; i++) {
      const x = i * barWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw notes
    notes.forEach(note => {
      const x = note.startTime * timeScale;
      const noteWidth = note.duration * timeScale;
      const midiNumber = noteNameToMidiNumber(note.pitch);
      const y = height - 20 - (midiNumber - lowestNote) * noteScale;
      
      // Draw note rectangle
      ctx.fillStyle = getColorForVelocity(note.velocity);
      ctx.fillRect(x, y, noteWidth, 10);
      
      // Draw note border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, noteWidth, 10);
    });
    
    // Draw legend
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.fillText(`Scale: ${melody.scale}`, 10, height - 5);
    ctx.fillText(`Tempo: ${melody.tempo} BPM`, width - 150, height - 5);
  };
  
  // Draw a chord progression visualization
  const drawChordProgression = (ctx, progression, width, height) => {
    if (!progression || !progression.progression || progression.progression.length === 0) return;
    
    const chords = progression.progression;
    const totalDuration = chords.reduce((sum, chord) => sum + chord.duration, 0);
    const timeScale = width / totalDuration;
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (chord positions)
    let currentPosition = 0;
    chords.forEach(chord => {
      const x = currentPosition * timeScale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      currentPosition += chord.duration;
    });
    
    // Draw chord blocks
    currentPosition = 0;
    chords.forEach((chord, index) => {
      const x = currentPosition * timeScale;
      const chordWidth = chord.duration * timeScale;
      
      // Draw chord rectangle
      ctx.fillStyle = getColorForChord(chord.type);
      ctx.fillRect(x, 20, chordWidth, height - 60);
      
      // Draw chord name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`${chord.root.slice(0, -1)}${chord.type}`, x + 10, 50);
      
      // Draw chord notes
      ctx.font = '12px Arial';
      ctx.fillText(chord.notes.join(', '), x + 10, 70);
      
      currentPosition += chord.duration;
    });
    
    // Draw legend
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.fillText(`Key: ${progression.key}`, 10, height - 5);
  };
  
  // Helper function to convert note name to MIDI number
  const noteNameToMidiNumber = (noteName) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = noteName.slice(0, -1);
    const octave = parseInt(noteName.slice(-1));
    return notes.indexOf(note) + (octave + 1) * 12;
  };
  
  // Helper function to get color based on velocity
  const getColorForVelocity = (velocity) => {
    // Normalize velocity to 0-1 range if it's in MIDI range (0-127)
    const normalizedVelocity = velocity > 1 ? velocity / 127 : velocity;
    
    // Generate color from blue (low velocity) to red (high velocity)
    const r = Math.floor(normalizedVelocity * 255);
    const g = Math.floor(100 + normalizedVelocity * 100);
    const b = Math.floor(255 - normalizedVelocity * 200);
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Helper function to get color based on chord type
  const getColorForChord = (chordType) => {
    const colors = {
      'maj': 'rgba(65, 105, 225, 0.7)',  // Royal blue
      'min': 'rgba(50, 205, 50, 0.7)',   // Lime green
      '7': 'rgba(255, 165, 0, 0.7)',     // Orange
      'maj7': 'rgba(138, 43, 226, 0.7)', // Purple
      'min7': 'rgba(0, 139, 139, 0.7)',  // Teal
      'dim': 'rgba(220, 20, 60, 0.7)',   // Crimson
      'aug': 'rgba(255, 215, 0, 0.7)',   // Gold
      'sus4': 'rgba(106, 90, 205, 0.7)', // Slate blue
    };
    
    return colors[chordType] || 'rgba(128, 128, 128, 0.7)'; // Default gray
  };
  
  return (
    <div className="visualization">
      <h2>Visualization</h2>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={200} 
        style={{ border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <p className="visualization-help">
        {type === 'melody' 
          ? 'Melody visualization: Each rectangle represents a note. Height indicates pitch, width indicates duration, and color indicates velocity.' 
          : 'Chord progression visualization: Each block represents a chord. Color indicates chord type.'}
      </p>
    </div>
  );
}

export default Visualization;