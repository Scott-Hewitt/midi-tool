import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MelodyGenerator from '../components/MelodyGenerator';

// Mock Tone.js
vi.mock('tone', () => {
  return {
    PolySynth: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn().mockReturnThis(),
      triggerAttackRelease: vi.fn()
    })),
    Synth: vi.fn(),
    Transport: {
      bpm: { value: 120 },
      stop: vi.fn(),
      cancel: vi.fn()
    },
    now: vi.fn().mockReturnValue(0)
  };
});

describe('MelodyGenerator Component', () => {
  const mockOnMelodyGenerated = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders with all controls', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);
    
    // Check for main title
    expect(screen.getByText('Melody Generator')).toBeInTheDocument();
    
    // Check for basic controls
    expect(screen.getByText('Scale:')).toBeInTheDocument();
    expect(screen.getByText('Tempo (BPM):')).toBeInTheDocument();
    expect(screen.getByText('Bars:')).toBeInTheDocument();
    expect(screen.getByText('Complexity:')).toBeInTheDocument();
    
    // Check for advanced options
    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
    expect(screen.getByText('Rhythm Pattern:')).toBeInTheDocument();
    expect(screen.getByText('Melodic Contour:')).toBeInTheDocument();
    expect(screen.getByText('Use Motif:')).toBeInTheDocument();
    expect(screen.getByText('Articulation:')).toBeInTheDocument();
    expect(screen.getByText('Dynamics:')).toBeInTheDocument();
    expect(screen.getByText('Humanize:')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByText('Generate Melody')).toBeInTheDocument();
    expect(screen.getByText('Play Melody')).toBeInTheDocument();
  });
  
  it('generates melody when button is clicked', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);
    
    // Click the generate button
    fireEvent.click(screen.getByText('Generate Melody'));
    
    // Check if callback was called
    expect(mockOnMelodyGenerated).toHaveBeenCalledTimes(1);
    
    // Check if melody info is displayed
    expect(screen.getByText('Generated Melody')).toBeInTheDocument();
  });
  
  it('toggles play/stop button text', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);
    
    // Generate a melody first
    fireEvent.click(screen.getByText('Generate Melody'));
    
    // Initial state should be "Play Melody"
    const playButton = screen.getByText('Play Melody');
    expect(playButton).toBeInTheDocument();
    
    // Click play button
    fireEvent.click(playButton);
    
    // Button should now say "Stop Playing"
    expect(screen.getByText('Stop Playing')).toBeInTheDocument();
    
    // Click stop button
    fireEvent.click(screen.getByText('Stop Playing'));
    
    // Button should say "Play Melody" again
    expect(screen.getByText('Play Melody')).toBeInTheDocument();
  });
  
  it('shows motif variation options when "Use Motif" is checked', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);
    
    // Initially, motif variation should not be visible
    expect(screen.queryByText('Motif Variation:')).not.toBeInTheDocument();
    
    // Check the "Use Motif" checkbox
    const useMotifCheckbox = screen.getByLabelText('Use Motif:');
    fireEvent.click(useMotifCheckbox);
    
    // Now motif variation should be visible
    expect(screen.getByText('Motif Variation:')).toBeInTheDocument();
    expect(screen.getByText('Transpose')).toBeInTheDocument();
  });
  
  it('updates state when controls are changed', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);
    
    // Change scale
    const scaleSelect = screen.getByLabelText('Scale:');
    fireEvent.change(scaleSelect, { target: { value: 'G Major' } });
    
    // Change tempo
    const tempoInput = screen.getByLabelText('Tempo (BPM):');
    fireEvent.change(tempoInput, { target: { value: 140 } });
    
    // Change bars
    const barsInput = screen.getByLabelText('Bars:');
    fireEvent.change(barsInput, { target: { value: 8 } });
    
    // Generate melody with new settings
    fireEvent.click(screen.getByText('Generate Melody'));
    
    // Check if the new settings are displayed in the melody info
    expect(screen.getByText('Scale: G Major')).toBeInTheDocument();
    expect(screen.getByText('Tempo: 140 BPM')).toBeInTheDocument();
    expect(screen.getByText('Length: 8 bars')).toBeInTheDocument();
  });
});