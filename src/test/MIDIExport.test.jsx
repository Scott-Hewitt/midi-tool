import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MIDIExport from '../components/MIDIExport';

// Mock the MIDI export utility
vi.mock('../utils/jzzMidi', () => {
  return {
    exportAndDownloadMIDI: vi.fn().mockResolvedValue(true)
  };
});

describe('MIDIExport Component', () => {
  const mockMelodyData = {
    scale: 'C Major',
    tempo: 120,
    notes: [
      { pitch: 'C4', duration: 1, velocity: 0.8, startTime: 0 },
      { pitch: 'E4', duration: 1, velocity: 0.7, startTime: 1 }
    ]
  };
  
  const mockChordData = {
    key: 'C major',
    progression: [
      { root: 'C4', type: 'maj', notes: ['C4', 'E4', 'G4'], duration: 1, position: 0 },
      { root: 'F4', type: 'maj', notes: ['F4', 'A4', 'C5'], duration: 1, position: 1 }
    ]
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders with all controls for melody export', () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);
    
    // Check for main title
    expect(screen.getByText('MIDI Export')).toBeInTheDocument();
    
    // Check for file name input
    expect(screen.getByLabelText('File Name:')).toBeInTheDocument();
    
    // Check for export options
    expect(screen.getByText('Export Options')).toBeInTheDocument();
    expect(screen.getByText('Include Melody Track')).toBeInTheDocument();
    expect(screen.getByText('Include Bass Track')).toBeInTheDocument();
    expect(screen.getByText('Melody Instrument:')).toBeInTheDocument();
    expect(screen.getByText('Chord Instrument:')).toBeInTheDocument();
    expect(screen.getByText('Bass Instrument:')).toBeInTheDocument();
    
    // Check for export button
    expect(screen.getByText('Export as MIDI')).toBeInTheDocument();
    
    // Check for info text
    expect(screen.getByText(/Export your melody as a standard MIDI file/)).toBeInTheDocument();
  });
  
  it('renders with all controls for chord export', () => {
    render(<MIDIExport data={mockChordData} type="chord" />);
    
    // Check for chord-specific options
    expect(screen.getByText('Include Chord Track')).toBeInTheDocument();
  });
  
  it('updates file name when input changes', () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);
    
    const fileNameInput = screen.getByLabelText('File Name:');
    fireEvent.change(fileNameInput, { target: { value: 'my-awesome-melody' } });
    
    expect(fileNameInput.value).toBe('my-awesome-melody');
  });
  
  it('toggles export options when checkboxes are clicked', () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);
    
    // Initially, melody track should be checked
    const melodyTrackCheckbox = screen.getByLabelText('Include Melody Track');
    expect(melodyTrackCheckbox).toBeChecked();
    
    // Uncheck melody track
    fireEvent.click(melodyTrackCheckbox);
    expect(melodyTrackCheckbox).not.toBeChecked();
    
    // Check humanize option
    const humanizeCheckbox = screen.getByLabelText(/Humanize/);
    expect(humanizeCheckbox).toBeChecked();
    
    // Uncheck humanize option
    fireEvent.click(humanizeCheckbox);
    expect(humanizeCheckbox).not.toBeChecked();
  });
  
  it('changes instrument selections when dropdowns are changed', () => {
    render(<MIDIExport data={mockMelodyData} type="melody" />);
    
    // Change melody instrument
    const melodyInstrumentSelect = screen.getByLabelText('Melody Instrument:');
    fireEvent.change(melodyInstrumentSelect, { target: { value: '73' } });
    
    // Change chord instrument
    const chordInstrumentSelect = screen.getByLabelText('Chord Instrument:');
    fireEvent.change(chordInstrumentSelect, { target: { value: '4' } });
    
    // Change bass instrument
    const bassInstrumentSelect = screen.getByLabelText('Bass Instrument:');
    fireEvent.change(bassInstrumentSelect, { target: { value: '33' } });
    
    // Verify the values have changed
    expect(melodyInstrumentSelect.value).toBe('73');
    expect(chordInstrumentSelect.value).toBe('4');
    expect(bassInstrumentSelect.value).toBe('33');
  });
  
  it('calls export function when export button is clicked', async () => {
    const { exportAndDownloadMIDI } = await import('../utils/jzzMidi');
    
    render(<MIDIExport data={mockMelodyData} type="melody" />);
    
    // Change file name
    const fileNameInput = screen.getByLabelText('File Name:');
    fireEvent.change(fileNameInput, { target: { value: 'test-export' } });
    
    // Click export button
    fireEvent.click(screen.getByText('Export as MIDI'));
    
    // Check if export function was called with correct parameters
    expect(exportAndDownloadMIDI).toHaveBeenCalledWith(
      mockMelodyData,
      null,
      'test-export-melody',
      expect.objectContaining({
        includeMelody: true,
        includeChords: false,
        includeBass: true
      })
    );
    
    // Success message should be displayed
    expect(screen.getByText('Melody exported successfully!')).toBeInTheDocument();
  });
  
  it('displays error message when export fails', async () => {
    const { exportAndDownloadMIDI } = await import('../utils/jzzMidi');
    exportAndDownloadMIDI.mockResolvedValueOnce(false);
    
    render(<MIDIExport data={mockMelodyData} type="melody" />);
    
    // Click export button
    fireEvent.click(screen.getByText('Export as MIDI'));
    
    // Error message should be displayed
    expect(screen.getByText('Error exporting melody')).toBeInTheDocument();
  });
  
  it('disables export button when no data is provided', () => {
    render(<MIDIExport data={null} type="melody" />);
    
    const exportButton = screen.getByText('Export as MIDI');
    expect(exportButton).toBeDisabled();
  });
});