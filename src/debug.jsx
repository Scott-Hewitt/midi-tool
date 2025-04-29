import { useState, useEffect } from 'react';
import { runAllTests } from './utils/debugChords';

function DebugPage() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const testResults = runAllTests();
      setResults(testResults);
    } catch (err) {
      console.error("Error running tests:", err);
      setError(err.message);
    }
  }, []);

  return (
    <div className="debug-container">
      <h1>Chord Generation Debug</h1>
      
      {error && (
        <div className="error-panel">
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}
      
      {results && (
        <div className="results-panel">
          <h2>Test Results</h2>
          
          <h3>Chord Generation</h3>
          {results.chordGeneration.success ? (
            <div>
              <p>✅ Chord generation successful</p>
              <h4>Basic Chords</h4>
              <pre>{JSON.stringify(results.chordGeneration.chords, null, 2)}</pre>
              
              <h4>Extended Chords</h4>
              <pre>{JSON.stringify(results.chordGeneration.extendedChords, null, 2)}</pre>
              
              <h4>Voice Leading Applied</h4>
              <pre>{JSON.stringify(results.chordGeneration.voiceLeadingChords, null, 2)}</pre>
            </div>
          ) : (
            <p>❌ Chord generation failed: {results.chordGeneration.error}</p>
          )}
          
          <h3>Chord Inversions</h3>
          {results.chordInversions.success ? (
            <div>
              <p>✅ Chord inversions successful</p>
              <h4>Root Position</h4>
              <pre>{JSON.stringify(results.chordInversions.rootPosition, null, 2)}</pre>
              
              <h4>First Inversion</h4>
              <pre>{JSON.stringify(results.chordInversions.firstInversion, null, 2)}</pre>
              
              <h4>Second Inversion</h4>
              <pre>{JSON.stringify(results.chordInversions.secondInversion, null, 2)}</pre>
            </div>
          ) : (
            <p>❌ Chord inversions failed: {results.chordInversions.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default DebugPage;
