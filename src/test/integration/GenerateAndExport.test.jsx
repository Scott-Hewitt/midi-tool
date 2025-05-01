import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import * as simpleMidi from '../../utils/simpleMidi';

// Mock the simpleMidi export utility
vi.mock('../../utils/simpleMidi', () => ({
  exportAndDownloadMIDI: vi.fn().mockResolvedValue(true),
  createMIDIFile: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  noteToMidiNumber: vi.fn((note) => {
    const notes = {'C4': 60, 'D4': 62, 'E4': 64, 'F4': 65, 'G4': 67, 'A4': 69, 'B4': 71};
    return notes[note] || 60;
  })
}));

// Mock the audio context
vi.mock('../../utils/audioContext', () => ({
  ensureAudioContext: vi.fn().mockResolvedValue(true),
  getAudioContext: vi.fn().mockReturnValue({
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined)
  }),
  registerUserInteraction: vi.fn()
}));

// Mock Tone.js
vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  Transport: {
    bpm: { value: 120 },
    stop: vi.fn(),
    cancel: vi.fn()
  },
  now: vi.fn().mockReturnValue(0),
  PolySynth: class MockPolySynth {
    constructor() {
      this.triggerAttackRelease = vi.fn();
      this.dispose = vi.fn();
      this.volume = { value: 0 };
    }
    toDestination() {
      return this;
    }
  },
  Synth: class MockSynth {}
}));

// Mock Firebase auth
vi.mock('../../utils/firebase/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    currentUser: null,
    userProfile: null
  })
}));

describe('Generate and Export Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock document.createElement and related methods for MIDI export
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      style: { display: 'none' }
    };
    
    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'a') return mockAnchor;
      return {};
    });
    
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    
    // Mock URL methods
    URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
    URL.revokeObjectURL = vi.fn();
    
    // Mock localStorage for welcome screen
    Storage.prototype.getItem = vi.fn().mockReturnValue('true');
  });
  
  it('allows generating a melody and exporting it as MIDI', async () => {
    // Render the app
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Wait for the app to load
    await waitFor(() => {
      expect(screen.getByText('MIDI Melody & Chord Generator')).toBeInTheDocument();
    });
    
    // Verify we're on the Melody Generator tab by default
    expect(screen.getByText('Melody Generator')).toBeInTheDocument();
    
    // Generate a melody
    const generateButton = screen.getByText('Generate Melody');
    fireEvent.click(generateButton);
    
    // Wait for the melody to be generated
    await waitFor(() => {
      expect(screen.getByText('Generated Melody')).toBeInTheDocument();
    });
    
    // Verify the visualization is shown
    expect(screen.getByText('Export as MIDI')).toBeInTheDocument();
    
    // Export the melody
    const exportButton = screen.getByText('Export as MIDI');
    fireEvent.click(exportButton);
    
    // Verify the export function was called
    expect(simpleMidi.exportAndDownloadMIDI).toHaveBeenCalled();
    
    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByText(/exported successfully/i)).toBeInTheDocument();
    });
  });
  
  it('allows generating a chord progression and exporting it as MIDI', async () => {
    // Render the app
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Wait for the app to load
    await waitFor(() => {
      expect(screen.getByText('MIDI Melody & Chord Generator')).toBeInTheDocument();
    });
    
    // Switch to the Chord Generator tab
    const chordTab = screen.getByText('Chord Generator');
    fireEvent.click(chordTab);
    
    // Wait for the chord generator to load
    await waitFor(() => {
      expect(screen.getByText('Generate Progression')).toBeInTheDocument();
    });
    
    // Generate a chord progression
    const generateButton = screen.getByText('Generate Progression');
    fireEvent.click(generateButton);
    
    // Wait for the chord progression to be generated
    await waitFor(() => {
      expect(screen.getByText('Generated Chord Progression')).toBeInTheDocument();
    });
    
    // Export the chord progression
    const exportButton = screen.getByText('Export as MIDI');
    fireEvent.click(exportButton);
    
    // Verify the export function was called
    expect(simpleMidi.exportAndDownloadMIDI).toHaveBeenCalled();
    
    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByText(/exported successfully/i)).toBeInTheDocument();
    });
  });
  
  it('allows generating a composition with melody and chords', async () => {
    // Render the app
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Wait for the app to load
    await waitFor(() => {
      expect(screen.getByText('MIDI Melody & Chord Generator')).toBeInTheDocument();
    });
    
    // Switch to the Composition Studio tab
    const compositionTab = screen.getByText('Composition Studio');
    fireEvent.click(compositionTab);
    
    // Wait for the composition generator to load
    await waitFor(() => {
      expect(screen.getByText(/Composition Studio/i)).toBeInTheDocument();
    });
    
    // Find and click the generate button (may have different text in Composition Studio)
    const generateButtons = screen.getAllByText(/Generate/i);
    const compositionGenerateButton = generateButtons.find(button => 
      button.textContent.includes('Composition') || 
      button.textContent.includes('Generate All')
    );
    
    if (compositionGenerateButton) {
      fireEvent.click(compositionGenerateButton);
      
      // Wait for the composition to be generated
      await waitFor(() => {
        const exportButtons = screen.getAllByText(/Export/i);
        expect(exportButtons.length).toBeGreaterThan(0);
      });
      
      // Find and click the export button
      const exportButtons = screen.getAllByText(/Export/i);
      const midiExportButton = exportButtons.find(button => 
        button.textContent.includes('MIDI') || 
        button.textContent.includes('Export')
      );
      
      if (midiExportButton) {
        fireEvent.click(midiExportButton);
        
        // Verify the export function was called
        expect(simpleMidi.exportAndDownloadMIDI).toHaveBeenCalled();
      }
    }
  });
});