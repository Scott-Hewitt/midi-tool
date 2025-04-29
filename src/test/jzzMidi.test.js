import { describe, it, expect, vi } from 'vitest';
import { noteToMidiNumber, initJZZ } from '../utils/jzzMidi';
import JZZ from 'jzz';

describe('jzzMidi Utility Functions', () => {

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

  describe('initJZZ', () => {
    it('initializes JZZ correctly', async () => {
      // Just test that initJZZ returns something
      const result = await initJZZ();
      expect(result).not.toBeNull();
    });
  });
});
