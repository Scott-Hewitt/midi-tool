import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Visualization from '../components/Visualization';

// Mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn()
};

// Mock canvas element
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);

describe('Visualization Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the visualization component', () => {
    render(<Visualization data={null} type="melody" />);
    
    expect(screen.getByText('Visualization')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '' })).toBeInTheDocument(); // Canvas element
  });
  
  it('displays melody visualization help text when type is melody', () => {
    render(<Visualization data={null} type="melody" />);
    
    expect(screen.getByText(/Melody visualization: Each rectangle represents a note/)).toBeInTheDocument();
  });
  
  it('displays chord visualization help text when type is chord', () => {
    render(<Visualization data={null} type="chord" />);
    
    expect(screen.getByText(/Chord progression visualization: Each block represents a chord/)).toBeInTheDocument();
  });
  
  it('does not draw anything when data is null', () => {
    render(<Visualization data={null} type="melody" />);
    
    expect(mockContext.clearRect).toHaveBeenCalledTimes(1);
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });
  
  it('draws melody visualization when melody data is provided', () => {
    const melodyData = {
      scale: 'C Major',
      tempo: 120,
      notes: [
        { pitch: 'C4', duration: 1, velocity: 0.8, startTime: 0 },
        { pitch: 'E4', duration: 1, velocity: 0.7, startTime: 1 }
      ]
    };
    
    render(<Visualization data={melodyData} type="melody" />);
    
    // Should clear the canvas
    expect(mockContext.clearRect).toHaveBeenCalledTimes(1);
    
    // Should draw background
    expect(mockContext.fillStyle).toBe('#f0f0f0');
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 200);
    
    // Should draw grid lines
    expect(mockContext.strokeStyle).toBe('#dddddd');
    expect(mockContext.beginPath).toHaveBeenCalled();
    
    // Should draw notes
    expect(mockContext.fillRect).toHaveBeenCalledTimes(3); // Background + 2 notes
    
    // Should draw legend
    expect(mockContext.fillText).toHaveBeenCalledWith('Scale: C Major', 10, 195);
    expect(mockContext.fillText).toHaveBeenCalledWith('Tempo: 120 BPM', 650, 195);
  });
  
  it('draws chord visualization when chord data is provided', () => {
    const chordData = {
      key: 'C major',
      progression: [
        { 
          root: 'C4', 
          type: 'maj', 
          notes: ['C4', 'E4', 'G4'], 
          duration: 1, 
          position: 0 
        },
        { 
          root: 'F4', 
          type: 'maj', 
          notes: ['F4', 'A4', 'C5'], 
          duration: 1, 
          position: 1 
        }
      ]
    };
    
    render(<Visualization data={chordData} type="chord" />);
    
    // Should clear the canvas
    expect(mockContext.clearRect).toHaveBeenCalledTimes(1);
    
    // Should draw background
    expect(mockContext.fillStyle).toBe('#f0f0f0');
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 200);
    
    // Should draw grid lines
    expect(mockContext.strokeStyle).toBe('#dddddd');
    expect(mockContext.beginPath).toHaveBeenCalled();
    
    // Should draw chord blocks
    expect(mockContext.fillRect).toHaveBeenCalledTimes(3); // Background + 2 chords
    
    // Should draw chord names and notes
    expect(mockContext.fillText).toHaveBeenCalledWith('Cmaj', 10, 50);
    expect(mockContext.fillText).toHaveBeenCalledWith('C4,E4,G4', 10, 70);
    
    // Should draw legend
    expect(mockContext.fillText).toHaveBeenCalledWith('Key: C major', 10, 195);
  });
});