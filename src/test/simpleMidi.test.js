import { describe, it, expect, vi, beforeEach } from 'vitest';
import { noteToMidiNumber, createMIDIFile, exportAndDownloadMIDI } from '../utils/simpleMidi';

describe('simpleMidi Utility Functions', () => {
  describe('noteToMidiNumber', () => {
    it('converts C4 to the correct MIDI number', () => {
      expect(noteToMidiNumber('C4')).toBe(60);
    });

    it('converts E5 to the correct MIDI number', () => {
      expect(noteToMidiNumber('E5')).toBe(76);
    });

    it('converts G#3 to the correct MIDI number', () => {
      expect(noteToMidiNumber('G#3')).toBe(56);
    });

    it('handles notes with sharps correctly', () => {
      expect(noteToMidiNumber('C#4')).toBe(61);
      expect(noteToMidiNumber('F#4')).toBe(66);
    });
  });

  describe('createMIDIFile', () => {
    const mockMelodyData = {
      tempo: 120,
      notes: [
        { pitch: 'C4', duration: 1, startTime: 0, velocity: 0.8 },
        { pitch: 'E4', duration: 1, startTime: 1, velocity: 0.7 },
      ],
    };

    const mockChordData = {
      tempo: 120,
      progression: [
        { root: 'C', notes: ['C4', 'E4', 'G4'], duration: 1, position: 0 },
        { root: 'F', notes: ['F4', 'A4', 'C5'], duration: 1, position: 1 },
      ],
    };

    it('creates a MIDI file with melody data', () => {
      const result = createMIDIFile(mockMelodyData, null);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
      // Check for MIDI header
      expect(result[0]).toBe(0x4D); // 'M'
      expect(result[1]).toBe(0x54); // 'T'
      expect(result[2]).toBe(0x68); // 'h'
      expect(result[3]).toBe(0x64); // 'd'
    });

    it('creates a MIDI file with chord data', () => {
      const result = createMIDIFile(null, mockChordData);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('creates a MIDI file with both melody and chord data', () => {
      const result = createMIDIFile(mockMelodyData, mockChordData);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('exportAndDownloadMIDI', () => {
    const mockMelodyData = {
      tempo: 120,
      notes: [
        { pitch: 'C4', duration: 1, startTime: 0, velocity: 0.8 },
      ],
    };

    beforeEach(() => {
      // Mock document.createElement and related methods
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {},
      };

      document.createElement = vi.fn().mockReturnValue(mockAnchor);
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      // Mock URL.createObjectURL and URL.revokeObjectURL
      URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
      URL.revokeObjectURL = vi.fn();

      // Store the mock anchor for tests to access
      global.mockAnchor = mockAnchor;

      // Mock setTimeout
      vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        callback();
        return 1;
      });
    });

    it('returns false when no data is provided', () => {
      const result = exportAndDownloadMIDI(null, null, 'test-file');
      expect(result).toBe(false);
    });

    it('creates and triggers download of a MIDI file', () => {
      const result = exportAndDownloadMIDI(mockMelodyData, null, 'test-file');

      expect(result).toBe(true);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('handles file name correctly', () => {
      exportAndDownloadMIDI(mockMelodyData, null, 'custom-name');

      expect(global.mockAnchor.download).toBe('custom-name.mid');
    });

    it('handles errors gracefully', () => {
      // Mock console.error
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock document.createElement to throw an error
      document.createElement = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = exportAndDownloadMIDI(mockMelodyData, null, 'test-file');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
