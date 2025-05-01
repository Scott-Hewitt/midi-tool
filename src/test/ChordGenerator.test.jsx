import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChordGenerator from '../components/ChordGenerator';
import * as toneContext from '../utils/toneContext';
import * as tonalUtils from '../utils/tonalUtils';
import * as chords from '../utils/chords';

// Mock the tone context
vi.mock('../utils/toneContext', () => ({
  initializeTone: vi.fn().mockResolvedValue(true),
  createSynth: vi.fn().mockReturnValue({
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn()
  })
}));

// Mock the tonal utils
vi.mock('../utils/tonalUtils', () => ({
  getKeys: vi.fn().mockReturnValue(['C major', 'A minor']),
  getCommonProgressions: vi.fn().mockReturnValue({
    'Basic I-IV-V-I': ['I', 'IV', 'V', 'I'],
    'Pop I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
    'Jazz ii-V-I': ['ii', 'V', 'I']
  }),
  generateChordProgression: vi.fn().mockReturnValue([
    {
      symbol: 'Cmaj',
      degree: 'I',
      notes: ['C4', 'E4', 'G4'],
      root: 'C',
      type: 'maj'
    },
    {
      symbol: 'Fmaj',
      degree: 'IV',
      notes: ['F4', 'A4', 'C5'],
      root: 'F',
      type: 'maj'
    },
    {
      symbol: 'G7',
      degree: 'V',
      notes: ['G4', 'B4', 'D5', 'F5'],
      root: 'G',
      type: '7'
    },
    {
      symbol: 'Cmaj',
      degree: 'I',
      notes: ['C4', 'E4', 'G4'],
      root: 'C',
      type: 'maj'
    }
  ]),
  getChordNotes: vi.fn().mockImplementation((chordSymbol) => {
    const chordMap = {
      'Cmaj': ['C4', 'E4', 'G4'],
      'Fmaj': ['F4', 'A4', 'C5'],
      'G7': ['G4', 'B4', 'D5', 'F5']
    };
    return chordMap[chordSymbol] || ['C4', 'E4', 'G4'];
  })
}));

// Mock the chords utility
vi.mock('../utils/chords', () => ({
  applyVoiceLeading: vi.fn(chords => chords)
}));

// Mock the audio context
vi.mock('../utils/audioContext', () => ({
  ensureAudioContext: vi.fn().mockResolvedValue(true),
  getAudioContext: vi.fn().mockReturnValue({
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined)
  })
}));

describe('ChordGenerator Component', () => {
  const mockOnChordGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with default options', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);

    expect(screen.getByText('Chord Generator')).toBeInTheDocument();
    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(screen.getByText('Progression')).toBeInTheDocument();
    expect(screen.getByText('Tempo (BPM): 120')).toBeInTheDocument();
    expect(screen.getByText('Chord Duration (bars)')).toBeInTheDocument();
    expect(screen.getByText('Generate Progression')).toBeInTheDocument();
  });

  it('allows changing chord parameters', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);

    // Change key
    const keySelect = screen.getByLabelText('Key');
    fireEvent.change(keySelect, { target: { value: 'A minor' } });
    expect(keySelect.value).toBe('A minor');

    // Change progression
    const progressionSelect = screen.getByLabelText('Progression');
    fireEvent.change(progressionSelect, { target: { value: 'Jazz ii-V-I' } });
    expect(progressionSelect.value).toBe('Jazz ii-V-I');

    // Change chord duration
    const durationInput = screen.getByLabelText('Chord Duration (bars)');
    fireEvent.change(durationInput, { target: { value: '2' } });
    expect(durationInput.value).toBe('2');
  });

  it('generates a chord progression when the button is clicked', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);

    const generateButton = screen.getByText('Generate Progression');
    fireEvent.click(generateButton);

    // Check that the callback was called with chord data
    expect(mockOnChordGenerated).toHaveBeenCalledTimes(1);
    expect(mockOnChordGenerated).toHaveBeenCalledWith(expect.objectContaining({
      key: 'C major',
      progression: expect.any(Array)
    }));

    // Check that generateChordProgression was called with the right parameters
    expect(tonalUtils.generateChordProgression).toHaveBeenCalledWith(
      'C major',
      ['I', 'IV', 'V', 'I'],
      false
    );
  });

  it('shows advanced options when expanded', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);

    // Advanced options are initially collapsed
    expect(screen.queryByText('Use Voice Leading')).not.toBeInTheDocument();

    // Expand advanced options
    const advancedOptionsButton = screen.getByText('Advanced Options');
    fireEvent.click(advancedOptionsButton);

    // Check that advanced options are now visible
    expect(screen.getByText('Use Voice Leading')).toBeInTheDocument();
    expect(screen.getByText('Use Inversions')).toBeInTheDocument();
    expect(screen.getByText('Use Extended Chords')).toBeInTheDocument();
    expect(screen.getByText('Auto-Randomize Options')).toBeInTheDocument();
  });

  it('applies advanced options when generating chord progression', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);

    // Expand advanced options
    const advancedOptionsButton = screen.getByText('Advanced Options');
    fireEvent.click(advancedOptionsButton);

    // Enable voice leading
    const voiceLeadingCheckbox = screen.getByLabelText('Use Voice Leading');
    fireEvent.click(voiceLeadingCheckbox);

    // Enable extended chords
    const extendedChordsCheckbox = screen.getByLabelText('Use Extended Chords');
    fireEvent.click(extendedChordsCheckbox);

    // Generate chord progression
    const generateButton = screen.getByText('Generate Progression');
    fireEvent.click(generateButton);

    // Check that the callback was called with the correct options
    expect(mockOnChordGenerated).toHaveBeenCalledWith(expect.objectContaining({
      useVoiceLeading: true,
      useExtendedChords: true
    }));

    // Check that generateChordProgression was called with extended chords
    expect(tonalUtils.generateChordProgression).toHaveBeenCalledWith(
      'C major',
      ['I', 'IV', 'V', 'I'],
      true
    );

    // Check that applyVoiceLeading was called
    expect(chords.applyVoiceLeading).toHaveBeenCalled();
  });

  it('displays generated chord progression information', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);

    // Generate chord progression
    const generateButton = screen.getByText('Generate Progression');
    fireEvent.click(generateButton);

    // Check that chord progression information is displayed
    expect(screen.getByText('Generated Chord Progression')).toBeInTheDocument();
    expect(screen.getByText('Key:')).toBeInTheDocument();
    
    // Check that chord symbols are displayed
    expect(screen.getByText('Cmaj')).toBeInTheDocument();
    expect(screen.getByText('Fmaj')).toBeInTheDocument();
    expect(screen.getByText('G7')).toBeInTheDocument();
  });

  it('handles inversions when enabled', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);

    // Expand advanced options
    const advancedOptionsButton = screen.getByText('Advanced Options');
    fireEvent.click(advancedOptionsButton);

    // Enable inversions
    const inversionsCheckbox = screen.getByLabelText('Use Inversions');
    fireEvent.click(inversionsCheckbox);

    // Select inversion type
    const inversionSelect = screen.getByLabelText('Inversion');
    fireEvent.change(inversionSelect, { target: { value: '1' } });

    // Generate chord progression
    const generateButton = screen.getByText('Generate Progression');
    fireEvent.click(generateButton);

    // Check that the callback was called with the correct options
    expect(mockOnChordGenerated).toHaveBeenCalledWith(expect.objectContaining({
      useInversions: true,
      inversion: 1
    }));
  });

  it('handles auto-randomize option', () => {
    render(<ChordGenerator onChordGenerated={mockOnChordGenerated} />);

    // Auto-randomize is enabled by default
    // Generate chord progression
    const generateButton = screen.getByText('Generate Progression');
    fireEvent.click(generateButton);

    // Check that the callback was called
    expect(mockOnChordGenerated).toHaveBeenCalled();

    // Expand advanced options
    const advancedOptionsButton = screen.getByText('Advanced Options');
    fireEvent.click(advancedOptionsButton);

    // Disable auto-randomize
    const autoRandomizeCheckbox = screen.getByLabelText('Auto-Randomize Options');
    fireEvent.click(autoRandomizeCheckbox);

    // Generate chord progression again
    fireEvent.click(generateButton);

    // Check that the callback was called again
    expect(mockOnChordGenerated).toHaveBeenCalledTimes(2);
  });
});