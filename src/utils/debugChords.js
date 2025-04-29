// Debug file for chord generation
import { 
  getCommonProgressions,
  generateChordProgression,
  getChordNotes
} from './tonalUtils';

import {
  applyVoiceLeading,
  generateChord,
  getChordInversion
} from './chords';

// Test chord generation
export function testChordGeneration() {
  console.log("=== Testing Chord Generation ===");
  
  // Test common progressions
  const progressions = getCommonProgressions();
  console.log("Available progressions:", progressions);
  
  // Test generating chord progression in C major
  const key = 'C major';
  const progressionPattern = progressions['Basic I-IV-V-I'];
  console.log(`Testing progression ${progressionPattern} in ${key}`);
  
  try {
    // Generate chord progression
    const chords = generateChordProgression(key, progressionPattern, false);
    console.log("Generated chords:", JSON.stringify(chords, null, 2));
    
    // Test with extended chords
    const extendedChords = generateChordProgression(key, progressionPattern, true);
    console.log("Extended chords:", JSON.stringify(extendedChords, null, 2));
    
    // Test voice leading
    const voiceLeadingChords = applyVoiceLeading(chords);
    console.log("Voice leading applied:", JSON.stringify(voiceLeadingChords, null, 2));
    
    return {
      success: true,
      chords,
      extendedChords,
      voiceLeadingChords
    };
  } catch (error) {
    console.error("Error generating chords:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test chord inversions
export function testChordInversions() {
  console.log("=== Testing Chord Inversions ===");
  
  try {
    // Test root position and inversions of C major chord
    const rootNote = 'C4';
    const chordType = 'maj';
    
    const rootPosition = generateChord(rootNote, chordType);
    console.log("Root position:", rootPosition);
    
    const firstInversion = getChordInversion(rootNote, chordType, 1);
    console.log("First inversion:", firstInversion);
    
    const secondInversion = getChordInversion(rootNote, chordType, 2);
    console.log("Second inversion:", secondInversion);
    
    return {
      success: true,
      rootPosition,
      firstInversion,
      secondInversion
    };
  } catch (error) {
    console.error("Error testing inversions:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run all tests
export function runAllTests() {
  const chordResults = testChordGeneration();
  const inversionResults = testChordInversions();
  
  return {
    chordGeneration: chordResults,
    chordInversions: inversionResults
  };
}

// Export a function to be called from the browser console
window.debugChords = runAllTests;
