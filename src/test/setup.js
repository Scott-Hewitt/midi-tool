import { expect, afterEach, vi } from 'vitest';
/* global global */
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Mock browser APIs that might be needed for tests
// Define global if it doesn't exist (for Node.js environment)
if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window;
}

global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock AudioContext and related Web Audio API features
class MockAudioContext {
  constructor() {
    this.destination = {};
    this.createGain = vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: { value: 1, setValueAtTime: vi.fn() },
    });
    this.createOscillator = vi.fn().mockReturnValue({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 },
    });
  }
}

// Only mock if not in a browser environment
if (typeof window !== 'undefined' && !window.AudioContext) {
  window.AudioContext = MockAudioContext;
  window.webkitAudioContext = MockAudioContext;
}

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
