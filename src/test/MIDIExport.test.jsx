import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MIDIExport from '../components/MIDIExport';
import * as simpleMidi from '../utils/simpleMidi';

// Mock window.scrollTo to avoid JSDOM errors
window.scrollTo = vi.fn();

// Mock the simpleMidi export utility
vi.mock('../utils/simpleMidi', () => ({
  exportAndDownloadMIDI: vi.fn().mockResolvedValue(true),
  createMIDIFile: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  noteToMidiNumber: vi.fn(note => {
    const notes = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71 };
    return notes[note] || 60;
  }),
}));

describe('MIDIExport Component', () => {
  const mockMelodyData = {
    scale: 'C Major',
    tempo: 120,
    notes: [
      { pitch: 'C4', duration: 1, startTime: 0, velocity: 0.8 },
      { pitch: 'E4', duration: 1, startTime: 1, velocity: 0.7 },
      { pitch: 'G4', duration: 1, startTime: 2, velocity: 0.9 },
    ],
  };

  const mockChordData = {
    key: 'C major',
    tempo: 120,
    progression: [
      { root: 'C', type: 'maj', notes: ['C4', 'E4', 'G4'], duration: 1, position: 0 },
      { root: 'F', type: 'maj', notes: ['F4', 'A4', 'C5'], duration: 1, position: 1 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with default options', () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);

    expect(screen.getByText('MIDI Export')).toBeInTheDocument();
    expect(screen.getByText('File Name')).toBeInTheDocument();
    expect(screen.getByText('Export Options')).toBeInTheDocument();
    expect(screen.getByText('Export as MIDI')).toBeInTheDocument();
  });

  it('allows changing the file name', () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);

    // Find the input by its placeholder instead of label
    const fileNameInput = screen.getByPlaceholderText('Enter file name');
    fireEvent.change(fileNameInput, { target: { value: 'test-melody' } });

    expect(fileNameInput.value).toBe('test-melody');
  });

  it('shows melody-specific options when type is melody', () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);

    expect(screen.getByText('Include Melody Track')).toBeInTheDocument();
    expect(screen.queryByText('Include Chord Track')).not.toBeInTheDocument();
  });

  it('shows chord-specific options when type is chord', () => {
    render(<MIDIExport data={mockChordData} type="chord" />);

    expect(screen.getByText('Include Chord Track')).toBeInTheDocument();
    expect(screen.queryByText('Include Melody Track')).not.toBeInTheDocument();
  });

  it('calls exportAndDownloadMIDI with correct parameters for melody', async () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);

    const exportButton = screen.getByText('Export as MIDI');
    fireEvent.click(exportButton);

    expect(simpleMidi.exportAndDownloadMIDI).toHaveBeenCalledWith(
      mockMelodyData,
      null,
      'my-music-melody',
      expect.objectContaining({
        includeMelody: true,
        includeChords: false,
      })
    );
  });

  it('calls exportAndDownloadMIDI with correct parameters for chord', async () => {
    render(<MIDIExport data={mockChordData} type="chord" />);

    const exportButton = screen.getByText('Export as MIDI');
    fireEvent.click(exportButton);

    expect(simpleMidi.exportAndDownloadMIDI).toHaveBeenCalledWith(
      null,
      mockChordData,
      'my-music-chord',
      expect.objectContaining({
        includeMelody: false,
        includeChords: true,
      })
    );
  });

  it('shows success message when export succeeds', async () => {
    // Mock the exportAndDownloadMIDI function to resolve with true
    simpleMidi.exportAndDownloadMIDI.mockResolvedValueOnce(true);

    render(<MIDIExport data={mockMelodyData} type="melody" />);

    const exportButton = screen.getByText('Export as MIDI');
    fireEvent.click(exportButton);

    // Wait for the async operation to complete
    await vi.waitFor(
      () => {
        expect(screen.getByText('Melody exported successfully!')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows error message when export fails', async () => {
    // Mock the export function to fail
    simpleMidi.exportAndDownloadMIDI.mockResolvedValueOnce(false);

    render(<MIDIExport data={mockMelodyData} type="melody" />);

    const exportButton = screen.getByText('Export as MIDI');
    fireEvent.click(exportButton);

    // Wait for the async operation to complete
    await vi.waitFor(() => {
      expect(screen.getByText('Error exporting melody')).toBeInTheDocument();
    });
  });

  it('handles export errors gracefully', async () => {
    // Mock the export function to throw an error
    simpleMidi.exportAndDownloadMIDI.mockRejectedValueOnce(new Error('Test error'));

    render(<MIDIExport data={mockMelodyData} type="melody" />);

    const exportButton = screen.getByText('Export as MIDI');
    fireEvent.click(exportButton);

    // Wait for the async operation to complete
    await vi.waitFor(() => {
      expect(screen.getByText('Error exporting melody: Test error')).toBeInTheDocument();
    });
  });

  it('disables export button when no data is provided', () => {
    render(<MIDIExport data={null} type="melody" />);

    const exportButton = screen.getByText('Export as MIDI');
    expect(exportButton).toBeDisabled();
  });

  it('allows toggling export options', () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);

    // First click on the Export Options accordion to expand it
    const accordionButton = screen.getByText('Export Options');
    fireEvent.click(accordionButton);

    // Find the first checkbox (which should be the melody track checkbox)
    const melodyCheckbox = screen.getAllByRole('checkbox')[0];
    expect(melodyCheckbox).toBeChecked();

    // Click to uncheck it
    fireEvent.click(melodyCheckbox);
    expect(melodyCheckbox).not.toBeChecked();

    // Check that the option change is reflected in the state
    const exportButton = screen.getByText('Export as MIDI');
    fireEvent.click(exportButton);

    // Use expect.objectContaining to match only the properties we care about
    expect(simpleMidi.exportAndDownloadMIDI).toHaveBeenCalledWith(
      mockMelodyData,
      null,
      'my-music-melody',
      expect.objectContaining({
        includeMelody: false,
      })
    );
  });
});
