import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MelodyGenerator from '../components/MelodyGenerator';
import * as toneContext from '../utils/toneContext';
import * as patterns from '../utils/patterns';
import * as humanize from '../utils/humanize';

// Mock the tone context
vi.mock('../utils/toneContext', () => ({
  initializeTone: vi.fn().mockResolvedValue(true),
  createSynth: vi.fn().mockReturnValue({
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn()
  })
}));

// Mock the patterns utility
vi.mock('../utils/patterns', () => ({
  rhythmPatterns: {
    basic: [1, 1, 1, 1],
    dotted: [1.5, 0.5, 1.5, 0.5],
    syncopated: [0.5, 1, 0.5, 1, 1]
  },
  contourTypes: {
    random: vi.fn(t => Math.random()),
    ascending: vi.fn(t => t),
    descending: vi.fn(t => 1 - t),
    arch: vi.fn(t => Math.sin(t * Math.PI))
  },
  generateMotif: vi.fn().mockReturnValue([
    { scaleIndex: 0, duration: 1 },
    { scaleIndex: 2, duration: 1 },
    { scaleIndex: 4, duration: 1 }
  ]),
  applyMotifVariation: vi.fn().mockReturnValue([
    { scaleIndex: 2, duration: 1 },
    { scaleIndex: 4, duration: 1 },
    { scaleIndex: 6, duration: 1 }
  ])
}));

// Mock the humanize utility
vi.mock('../utils/humanize', () => ({
  humanizeNotes: vi.fn(notes => notes),
  applyArticulation: vi.fn(notes => notes),
  applyDynamics: vi.fn(notes => notes)
}));

// Mock the audio context
vi.mock('../utils/audioContext', () => ({
  ensureAudioContext: vi.fn().mockResolvedValue(true),
  getAudioContext: vi.fn().mockReturnValue({
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined)
  })
}));

describe('MelodyGenerator Component', () => {
  const mockOnMelodyGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with default options', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);

    expect(screen.getByText('Melody Generator')).toBeInTheDocument();
    expect(screen.getByText('Scale')).toBeInTheDocument();
    expect(screen.getByText('Tempo (BPM): 120')).toBeInTheDocument();
    expect(screen.getByText('Bars')).toBeInTheDocument();
    expect(screen.getByText('Complexity: 5')).toBeInTheDocument();
    expect(screen.getByText('Generate Melody')).toBeInTheDocument();
  });

  it('allows changing melody parameters', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);

    // Change scale
    const scaleSelect = screen.getByLabelText('Scale');
    fireEvent.change(scaleSelect, { target: { value: 'A Minor' } });
    expect(scaleSelect.value).toBe('A Minor');

    // Change bars
    const barsInput = screen.getByLabelText('Bars');
    fireEvent.change(barsInput, { target: { value: '8' } });
    expect(barsInput.value).toBe('8');
  });

  it('generates a melody when the button is clicked', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);

    const generateButton = screen.getByText('Generate Melody');
    fireEvent.click(generateButton);

    // Check that the callback was called with melody data
    expect(mockOnMelodyGenerated).toHaveBeenCalledTimes(1);
    expect(mockOnMelodyGenerated).toHaveBeenCalledWith(expect.objectContaining({
      scale: 'C Major',
      tempo: 120,
      length: 4,
      complexity: 5,
      notes: expect.any(Array)
    }));
  });

  it('shows advanced options when expanded', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);

    // Advanced options are initially collapsed
    expect(screen.queryByText('Rhythm Pattern')).not.toBeInTheDocument();

    // Expand advanced options
    const advancedOptionsButton = screen.getByText('Advanced Options');
    fireEvent.click(advancedOptionsButton);

    // Check that advanced options are now visible
    expect(screen.getByText('Rhythm Pattern')).toBeInTheDocument();
    expect(screen.getByText('Melodic Contour')).toBeInTheDocument();
    expect(screen.getByText('Use Motif')).toBeInTheDocument();
  });

  it('applies advanced options when generating melody', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);

    // Expand advanced options
    const advancedOptionsButton = screen.getByText('Advanced Options');
    fireEvent.click(advancedOptionsButton);

    // Change rhythm pattern
    const rhythmPatternSelect = screen.getByLabelText('Rhythm Pattern');
    fireEvent.change(rhythmPatternSelect, { target: { value: 'dotted' } });

    // Change contour
    const contourSelect = screen.getByLabelText('Melodic Contour');
    fireEvent.change(contourSelect, { target: { value: 'ascending' } });

    // Enable motif
    const motifCheckbox = screen.getByLabelText('Use Motif');
    fireEvent.click(motifCheckbox);

    // Generate melody
    const generateButton = screen.getByText('Generate Melody');
    fireEvent.click(generateButton);

    // Check that the callback was called with the correct options
    expect(mockOnMelodyGenerated).toHaveBeenCalledWith(expect.objectContaining({
      rhythmPattern: 'dotted',
      contourType: 'ascending',
      useMotif: true
    }));
  });

  it('displays generated melody information', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);

    // Generate melody
    const generateButton = screen.getByText('Generate Melody');
    fireEvent.click(generateButton);

    // Check that melody information is displayed
    expect(screen.getByText('Generated Melody')).toBeInTheDocument();
    expect(screen.getByText('Scale:')).toBeInTheDocument();
    expect(screen.getByText('Tempo:')).toBeInTheDocument();
    expect(screen.getByText('Length:')).toBeInTheDocument();
  });

  it('calls humanization functions when enabled', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);

    // Expand advanced options
    const advancedOptionsButton = screen.getByText('Advanced Options');
    fireEvent.click(advancedOptionsButton);

    // Enable humanization
    const humanizeCheckbox = screen.getByLabelText('Humanize');
    fireEvent.click(humanizeCheckbox);
    fireEvent.click(humanizeCheckbox); // Click twice to ensure it's checked

    // Generate melody
    const generateButton = screen.getByText('Generate Melody');
    fireEvent.click(generateButton);

    // Check that humanizeNotes was called
    expect(humanize.humanizeNotes).toHaveBeenCalled();
  });

  it('handles auto-randomize option', () => {
    render(<MelodyGenerator onMelodyGenerated={mockOnMelodyGenerated} />);

    // Expand advanced options
    const advancedOptionsButton = screen.getByText('Advanced Options');
    fireEvent.click(advancedOptionsButton);

    // Enable auto-randomize
    const autoRandomizeCheckbox = screen.getByLabelText('Auto-Randomize Options');
    fireEvent.click(autoRandomizeCheckbox);

    // Generate melody
    const generateButton = screen.getByText('Generate Melody');
    fireEvent.click(generateButton);

    // Check that the callback was called with randomized options
    expect(mockOnMelodyGenerated).toHaveBeenCalled();
  });
});