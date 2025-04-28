import { useState } from 'react'
import './App.css'
import MelodyGenerator from './components/MelodyGenerator'
import ChordGenerator from './components/ChordGenerator'
import Visualization from './components/Visualization'
import MIDIExport from './components/MIDIExport'

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

      <main className="app-content">
        <div className={`tab-content ${activeTab === 'melody' ? 'active' : ''}`}>
          <div className="generator-section">
            <MelodyGenerator onMelodyGenerated={handleMelodyGenerated} />
          </div>

          {melodyData && (
            <>
              <div className="visualization-section">
                <Visualization data={melodyData} type="melody" />
              </div>

              <div className="export-section">
                <MIDIExport data={melodyData} type="melody" />
              </div>
            </>
          )}
        </div>

        <div className={`tab-content ${activeTab === 'chord' ? 'active' : ''}`}>
          <div className="generator-section">
            <ChordGenerator onChordGenerated={handleChordGenerated} />
          </div>

          {chordData && (
            <>
              <div className="visualization-section">
                <Visualization data={chordData} type="chord" />
              </div>

              <div className="export-section">
                <MIDIExport data={chordData} type="chord" />
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>MIDI Melody & Chord Generator - MVP Version</p>
      </footer>
    </div>
  )
}

export default App
