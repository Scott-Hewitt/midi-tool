import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChordGenerator from '../components/ChordGenerator';

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

// Mock SoundFont-Player
vi.mock('../utils/soundfontUtils', () => {
  return {
    loadInstrument: vi.fn().mockResolvedValue({}),
    getAvailableInstruments: vi.fn().mockReturnValue({
      'acoustic_grand_piano': 'Piano',
      'electric_piano_1': 'Electric Piano'
    }),
    playChordProgressionWithSoundFont: vi.fn().mockResolvedValue(true),
    stopAllSounds: vi.fn()
  };
});

// Mock Tonal.js utilities
vi.mock('../utils/tonalUtils', () => {
  return {
    getKeys: vi.fn().mockReturnValue(['C major', 'A minor']),
    getCommonProgressions: vi.fn().mockReturnValue({
      'Basic I-IV-V-I': ['I', 'IV', 'V', 'I'],
      'Jazz ii-V-I': ['ii', 'V', 'I']
    }),
    generateChordProgression: vi.fn().mockReturnValue([
      { symbol: 'Cmaj7', degree: 'I', notes: ['C4', 'E4', 'G4', 'B4'] },
      { symbol: 'Fmaj7', degree: 'IV', notes: ['F4', 'A4', 'C5', 'E5'] }
    ])
  };
});

describe('ChordGenerator Component', () => {
  const mockOnChordGenerated = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders with all controls', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);
    
    // Check for main title
    expect(screen.getByText('Chord Generator')).toBeInTheDocument();
    
    // Check for basic controls
    expect(screen.getByText('Key:')).toBeInTheDocument();
    expect(screen.getByText('Progression:')).toBeInTheDocument();
    expect(screen.getByText('Tempo (BPM):')).toBeInTheDocument();
    expect(screen.getByText('Chord Duration (bars):')).toBeInTheDocument();
    
    // Check for advanced options
    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
    expect(screen.getByText('Use Voice Leading:')).toBeInTheDocument();
    expect(screen.getByText('Use Inversions:')).toBeInTheDocument();
    expect(screen.getByText('Use Extended Chords:')).toBeInTheDocument();
    
    // Check for sound options
    expect(screen.getByText('Sound Options')).toBeInTheDocument();
    expect(screen.getByText('Use Realistic Instrument Sounds:')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByText('Generate Progression')).toBeInTheDocument();
    expect(screen.getByText('Play Progression')).toBeInTheDocument();
  });
  
  it('generates chord progression when button is clicked', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);
    
    // Click the generate button
    fireEvent.click(screen.getByText('Generate Progression'));
    
    // Check if callback was called
    expect(mockOnChordGenerated).toHaveBeenCalledTimes(1);
    
    // Check if progression info is displayed
    expect(screen.getByText('Generated Chord Progression')).toBeInTheDocument();
  });
  
  it('toggles play/stop button text', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);
    
    // Generate a progression first
    fireEvent.click(screen.getByText('Generate Progression'));
    
    // Initial state should be "Play Progression"
    const playButton = screen.getByText('Play Progression');
    expect(playButton).toBeInTheDocument();
    
    // Click play button
    fireEvent.click(playButton);
    
    // Button should now say "Stop Playing"
    expect(screen.getByText('Stop Playing')).toBeInTheDocument();
    
    // Click stop button
    fireEvent.click(screen.getByText('Stop Playing'));
    
    // Button should say "Play Progression" again
    expect(screen.getByText('Play Progression')).toBeInTheDocument();
  });
  
  it('shows inversion options when "Use Inversions" is checked', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);
    
    // Initially, inversion selection should not be visible
    expect(screen.queryByText('Inversion:')).not.toBeInTheDocument();
    
    // Check the "Use Inversions" checkbox
    const useInversionsCheckbox = screen.getByLabelText('Use Inversions:');
    fireEvent.click(useInversionsCheckbox);
    
    // Now inversion selection should be visible
    expect(screen.getByText('Inversion:')).toBeInTheDocument();
    expect(screen.getByText('Root Position')).toBeInTheDocument();
  });
  
  it('shows instrument selection when "Use Realistic Instrument Sounds" is checked', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);
    
    // "Use Realistic Instrument Sounds" should be checked by default
    expect(screen.getByLabelText('Instrument:')).toBeInTheDocument();
    
    // Uncheck the "Use Realistic Instrument Sounds" checkbox
    const useSoundFontCheckbox = screen.getByLabelText('Use Realistic Instrument Sounds:');
    fireEvent.click(useSoundFontCheckbox);
    
    // Now instrument selection should not be visible
    expect(screen.queryByLabelText('Instrument:')).not.toBeInTheDocument();
    
    // Check it again
    fireEvent.click(useSoundFontCheckbox);
    
    // Instrument selection should be visible again
    expect(screen.getByLabelText('Instrument:')).toBeInTheDocument();
  });
  
  it('updates state when controls are changed', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);
    
    // Change key
    const keySelect = screen.getByLabelText('Key:');
    fireEvent.change(keySelect, { target: { value: 'A minor' } });
    
    // Change progression
    const progressionSelect = screen.getByLabelText('Progression:');
    fireEvent.change(progressionSelect, { target: { value: 'Jazz ii-V-I' } });
    
    // Change tempo
    const tempoInput = screen.getByLabelText('Tempo (BPM):');
    fireEvent.change(tempoInput, { target: { value: 140 } });
    
    // Generate progression with new settings
    fireEvent.click(screen.getByText('Generate Progression'));
    
    // Check if the new settings are displayed in the progression info
    expect(screen.getByText('Key: A minor')).toBeInTheDocument();
    
    // Check if the callback was called with the updated values
    expect(mockOnChordGenerated).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'A minor'
      })
    );
  });
});