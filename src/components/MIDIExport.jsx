import { useState, useEffect } from 'react';
import { exportAndDownloadMIDI, isMIDISupported as checkMIDISupport, MIDIError } from '../utils/jzzMidi';

function MIDIExport({ data, type }) {
  const [fileName, setFileName] = useState('my-music');
  const [exportStatus, setExportStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info', 'success', 'error', 'warning'
  const [isMIDISupported, setIsMIDISupported] = useState(true); // Assume supported until checked
  const [exportOptions, setExportOptions] = useState({
    includeMelody: true,
    includeChords: true,
    includeBass: true,
    melodyInstrument: 0, // Piano
    chordInstrument: 4,  // Electric Piano
    bassInstrument: 32,  // Acoustic Bass
    applyExpression: true,
    humanize: true
  });

  // Check for MIDI support when component mounts
  useEffect(() => {
    const checkMIDISupportStatus = () => {
      const supported = checkMIDISupport();
      setIsMIDISupported(supported);

      if (!supported) {
        setExportStatus('MIDI export is not supported in this browser. Try using a modern browser like Chrome, Firefox, or Edge.');
        setStatusType('warning');
      }
    };

    checkMIDISupportStatus();
  }, []);

  // Handle option changes
  const handleOptionChange = (option, value) => {
    setExportOptions({
      ...exportOptions,
      [option]: value
    });
  };

  // Clear status message
  const clearStatus = (delay = 5000) => {
    setTimeout(() => {
      setExportStatus('');
      setStatusType('info');
    }, delay);
  };

  // Export MIDI file using JZZ
  const handleExport = async () => {
    // Check if MIDI is supported
    if (!isMIDISupported) {
      setExportStatus('MIDI export is not supported in this browser. Try using a modern browser like Chrome, Firefox, or Edge.');
      setStatusType('error');
      return;
    }

    // Determine which data to use
    const melodyData = type === 'melody' ? data : null;
    const chordData = type === 'chord' ? data : null;

    if (!melodyData && !chordData) {
      setExportStatus('No data to export. Please generate a melody or chord progression first.');
      setStatusType('warning');
      return;
    }

    // Validate file name
    if (!fileName.trim()) {
      setExportStatus('Please enter a valid file name.');
      setStatusType('warning');
      return;
    }

    // Show processing status
    setExportStatus('Preparing MIDI file...');
    setStatusType('info');

    try {
      // Set export options based on data type
      const options = {
        ...exportOptions,
        includeMelody: type === 'melody' && exportOptions.includeMelody,
        includeChords: type === 'chord' && exportOptions.includeChords
      };

      // Export the MIDI file
      const success = await exportAndDownloadMIDI(
        melodyData, 
        chordData, 
        `${fileName}-${type}`,
        options
      );

      if (success) {
        setExportStatus(`${type === 'melody' ? 'Melody' : 'Chord progression'} exported successfully! Check your downloads folder.`);
        setStatusType('success');
        clearStatus();
      } else {
        setExportStatus(`Failed to export ${type}. Please try again.`);
        setStatusType('error');
      }
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);

      // Handle specific error types
      if (error instanceof MIDIError) {
        if (error.message.includes('not supported')) {
          setExportStatus('MIDI export is not supported in this browser. Try using a modern browser like Chrome, Firefox, or Edge.');
        } else if (error.message.includes('download')) {
          setExportStatus('Failed to download the MIDI file. Check if your browser allows downloads or try a different browser.');
        } else if (error.message.includes('generate')) {
          setExportStatus('Failed to generate the MIDI file. The music data may be invalid or too complex.');
        } else {
          setExportStatus(`MIDI export error: ${error.message}`);
        }
      } else {
        setExportStatus(`Unexpected error during export: ${error.message || 'Unknown error'}`);
      }

      setStatusType('error');
    }
  };

  return (
    <div className="midi-export" role="region" aria-label="MIDI Export">
      <h2 id="midi-export-title">MIDI Export</h2>

      <form className="export-controls" onSubmit={(e) => e.preventDefault()} aria-labelledby="midi-export-title">
        <div className="control-group">
          <label htmlFor="file-name-input">
            File Name:
          </label>
          <input 
            id="file-name-input"
            type="text" 
            value={fileName} 
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
            aria-describedby="file-name-description"
          />
          <span id="file-name-description" className="sr-only">Name for your exported MIDI file</span>
        </div>

        <fieldset className="advanced-export-options">
          <legend>Export Options</legend>

          {type === 'melody' && (
            <div className="option-group">
              <label htmlFor="include-melody-checkbox">
                <input
                  id="include-melody-checkbox"
                  type="checkbox"
                  checked={exportOptions.includeMelody}
                  onChange={(e) => handleOptionChange('includeMelody', e.target.checked)}
                  aria-describedby="include-melody-description"
                />
                Include Melody Track
              </label>
              <span id="include-melody-description" className="sr-only">Include the melody notes in the MIDI file</span>
            </div>
          )}

          {type === 'chord' && (
            <div className="option-group">
              <label htmlFor="include-chords-checkbox">
                <input
                  id="include-chords-checkbox"
                  type="checkbox"
                  checked={exportOptions.includeChords}
                  onChange={(e) => handleOptionChange('includeChords', e.target.checked)}
                  aria-describedby="include-chords-description"
                />
                Include Chord Track
              </label>
              <span id="include-chords-description" className="sr-only">Include the chord notes in the MIDI file</span>
            </div>
          )}

          <div className="option-group">
            <label htmlFor="include-bass-checkbox">
              <input
                id="include-bass-checkbox"
                type="checkbox"
                checked={exportOptions.includeBass}
                onChange={(e) => handleOptionChange('includeBass', e.target.checked)}
                aria-describedby="include-bass-description"
              />
              Include Bass Track
            </label>
            <span id="include-bass-description" className="sr-only">Include a bass line using the root notes of chords</span>
          </div>

          <div className="option-group">
            <label htmlFor="melody-instrument-select">
              Melody Instrument:
            </label>
            <select
              id="melody-instrument-select"
              value={exportOptions.melodyInstrument}
              onChange={(e) => handleOptionChange('melodyInstrument', parseInt(e.target.value))}
              aria-describedby="melody-instrument-description"
            >
              <option value="0">Piano</option>
              <option value="4">Electric Piano</option>
              <option value="24">Acoustic Guitar</option>
              <option value="73">Flute</option>
              <option value="66">Saxophone</option>
              <option value="40">Violin</option>
            </select>
            <span id="melody-instrument-description" className="sr-only">Select the instrument for the melody track</span>
          </div>

          <div className="option-group">
            <label htmlFor="chord-instrument-select">
              Chord Instrument:
            </label>
            <select
              id="chord-instrument-select"
              value={exportOptions.chordInstrument}
              onChange={(e) => handleOptionChange('chordInstrument', parseInt(e.target.value))}
              aria-describedby="chord-instrument-description"
            >
              <option value="0">Piano</option>
              <option value="4">Electric Piano</option>
              <option value="24">Acoustic Guitar</option>
              <option value="48">String Ensemble</option>
              <option value="19">Church Organ</option>
              <option value="5">Electric Piano 2</option>
            </select>
            <span id="chord-instrument-description" className="sr-only">Select the instrument for the chord track</span>
          </div>

          <div className="option-group">
            <label htmlFor="bass-instrument-select">
              Bass Instrument:
            </label>
            <select
              id="bass-instrument-select"
              value={exportOptions.bassInstrument}
              onChange={(e) => handleOptionChange('bassInstrument', parseInt(e.target.value))}
              aria-describedby="bass-instrument-description"
            >
              <option value="32">Acoustic Bass</option>
              <option value="33">Electric Bass</option>
              <option value="34">Electric Bass (pick)</option>
              <option value="35">Fretless Bass</option>
              <option value="36">Slap Bass 1</option>
              <option value="42">Cello</option>
            </select>
            <span id="bass-instrument-description" className="sr-only">Select the instrument for the bass track</span>
          </div>

          <div className="option-group">
            <label htmlFor="expression-checkbox">
              <input
                id="expression-checkbox"
                type="checkbox"
                checked={exportOptions.applyExpression}
                onChange={(e) => handleOptionChange('applyExpression', e.target.checked)}
                aria-describedby="expression-description"
              />
              Apply Expression (dynamics, volume changes)
            </label>
            <span id="expression-description" className="sr-only">Add volume and expression changes for more musical results</span>
          </div>

          <div className="option-group">
            <label htmlFor="humanize-checkbox">
              <input
                id="humanize-checkbox"
                type="checkbox"
                checked={exportOptions.humanize}
                onChange={(e) => handleOptionChange('humanize', e.target.checked)}
                aria-describedby="humanize-description"
              />
              Humanize (slight timing and velocity variations)
            </label>
            <span id="humanize-description" className="sr-only">Add subtle variations to timing and velocity for a more natural sound</span>
          </div>
        </fieldset>

        <button 
          onClick={handleExport}
          disabled={!data}
          aria-label="Export as MIDI file with selected options"
          aria-disabled={!data}
        >
          Export as MIDI
        </button>
      </form>

      {exportStatus && (
        <div className={`export-status ${statusType}`} role="status" aria-live="polite">
          <span className="status-icon" aria-hidden="true">
            {statusType === 'success' && '✓'}
            {statusType === 'error' && '✗'}
            {statusType === 'warning' && '⚠'}
            {statusType === 'info' && 'ℹ'}
          </span>
          {exportStatus}
        </div>
      )}

      <section className="export-info" aria-label="MIDI Export Information">
        <p>
          Export your {type === 'melody' ? 'melody' : 'chord progression'} as a standard MIDI file 
          that can be imported into any Digital Audio Workstation (DAW) like Ableton Live, 
          Logic Pro, FL Studio, etc.
        </p>
        <p>
          <strong>Pro Tip:</strong> Customize your export with the options above to create more 
          professional and complete MIDI files with multiple tracks and instruments.
        </p>
      </section>
    </div>
  );
}

export default MIDIExport;
