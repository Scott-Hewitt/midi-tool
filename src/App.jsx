import { useState } from 'react'
import './App.css'
import MelodyGenerator from './components/MelodyGenerator'
import ChordGenerator from './components/ChordGenerator'
import Visualization from './components/Visualization'
import MIDIExport from './components/MIDIExport'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const [activeTab, setActiveTab] = useState('melody');
  const [melodyData, setMelodyData] = useState(null);
  const [chordData, setChordData] = useState(null);

  // Handle melody generation
  const handleMelodyGenerated = (data) => {
    setMelodyData(data);
  };

  // Handle chord progression generation
  const handleChordGenerated = (data) => {
    setChordData(data);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MIDI Melody & Chord Generator</h1>
        <p className="app-description">
          Generate melodies and chord progressions, visualize them, and export as MIDI files.
        </p>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'melody' ? 'active' : ''}`}
          onClick={() => setActiveTab('melody')}
        >
          Melody Generator
        </button>
        <button 
          className={`tab ${activeTab === 'chord' ? 'active' : ''}`}
          onClick={() => setActiveTab('chord')}
        >
          Chord Generator
        </button>
      </div>

      <ErrorBoundary>
        <main className="app-content">
          <div className={`tab-content ${activeTab === 'melody' ? 'active' : ''}`}>
            <div className="generator-section">
              <ErrorBoundary fallback={<div className="error-fallback">Melody Generator is currently unavailable. Please try again later.</div>}>
                <MelodyGenerator onMelodyGenerated={handleMelodyGenerated} />
              </ErrorBoundary>
            </div>

            {melodyData && (
              <>
                <div className="visualization-section">
                  <ErrorBoundary fallback={<div className="error-fallback">Visualization is currently unavailable. Your melody has been generated successfully.</div>}>
                    <Visualization data={melodyData} type="melody" />
                  </ErrorBoundary>
                </div>

                <div className="export-section">
                  <ErrorBoundary fallback={<div className="error-fallback">MIDI Export is currently unavailable. Please try again later.</div>}>
                    <MIDIExport data={melodyData} type="melody" />
                  </ErrorBoundary>
                </div>
              </>
            )}
          </div>

          <div className={`tab-content ${activeTab === 'chord' ? 'active' : ''}`}>
            <div className="generator-section">
              <ErrorBoundary fallback={<div className="error-fallback">Chord Generator is currently unavailable. Please try again later.</div>}>
                <ChordGenerator onChordGenerated={handleChordGenerated} />
              </ErrorBoundary>
            </div>

            {chordData && (
              <>
                <div className="visualization-section">
                  <ErrorBoundary fallback={<div className="error-fallback">Visualization is currently unavailable. Your chord progression has been generated successfully.</div>}>
                    <Visualization data={chordData} type="chord" />
                  </ErrorBoundary>
                </div>

                <div className="export-section">
                  <ErrorBoundary fallback={<div className="error-fallback">MIDI Export is currently unavailable. Please try again later.</div>}>
                    <MIDIExport data={chordData} type="chord" />
                  </ErrorBoundary>
                </div>
              </>
            )}
          </div>
        </main>
      </ErrorBoundary>

      <footer className="app-footer">
        <p>MIDI Melody & Chord Generator - MVP Version</p>
      </footer>
    </div>
  )
}

export default App
