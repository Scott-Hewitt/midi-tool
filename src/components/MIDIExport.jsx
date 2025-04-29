import { useState } from 'react';
import { exportAndDownloadMIDI } from '../utils/simpleMidi';

function MIDIExport({ data, type }) {
  const [fileName, setFileName] = useState('my-music');
  const [exportStatus, setExportStatus] = useState('');
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

  // Handle option changes
  const handleOptionChange = (option, value) => {
    setExportOptions({
      ...exportOptions,
      [option]: value
    });
  };

  // Export MIDI file using JZZ
  const handleExport = async () => {
    // Determine which data to use
    const melodyData = type === 'melody' ? data : null;
    const chordData = type === 'chord' ? data : null;

    if (!melodyData && !chordData) {
      setExportStatus('No data to export');
      return;
    }

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
        setExportStatus(`${type === 'melody' ? 'Melody' : 'Chord progression'} exported successfully!`);
      } else {
        setExportStatus(`Error exporting ${type}`);
      }

      // Clear the status message after 3 seconds
      setTimeout(() => {
        setExportStatus('');
      }, 3000);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      setExportStatus(`Error exporting ${type}: ${error.message}`);
    }
  };

  return (
    <div className="midi-export">
      <h2>MIDI Export</h2>

      <div className="export-controls">
        <div className="control-group">
          <label>
            File Name:
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
            />
          </label>
        </div>

        <div className="advanced-export-options">
          <h3>Export Options</h3>

          {type === 'melody' && (
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.includeMelody}
                  onChange={(e) => handleOptionChange('includeMelody', e.target.checked)}
                />
                Include Melody Track
              </label>
            </div>
          )}

          {type === 'chord' && (
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={exportOptions.includeChords}
                  onChange={(e) => handleOptionChange('includeChords', e.target.checked)}
                />
                Include Chord Track
              </label>
            </div>
          )}

          <div className="option-group">
            <label>
              <input
                type="checkbox"
                checked={exportOptions.includeBass}
                onChange={(e) => handleOptionChange('includeBass', e.target.checked)}
              />
              Include Bass Track
            </label>
          </div>

          <div className="option-group">
            <label>
              Melody Instrument:
              <select
                value={exportOptions.melodyInstrument}
                onChange={(e) => handleOptionChange('melodyInstrument', parseInt(e.target.value))}
              >
                <option value="0">Piano</option>
                <option value="4">Electric Piano</option>
                <option value="24">Acoustic Guitar</option>
                <option value="73">Flute</option>
                <option value="66">Saxophone</option>
                <option value="40">Violin</option>
              </select>
            </label>
          </div>

          <div className="option-group">
            <label>
              Chord Instrument:
              <select
                value={exportOptions.chordInstrument}
                onChange={(e) => handleOptionChange('chordInstrument', parseInt(e.target.value))}
              >
                <option value="0">Piano</option>
                <option value="4">Electric Piano</option>
                <option value="24">Acoustic Guitar</option>
                <option value="48">String Ensemble</option>
                <option value="19">Church Organ</option>
                <option value="5">Electric Piano 2</option>
              </select>
            </label>
          </div>

          <div className="option-group">
            <label>
              Bass Instrument:
              <select
                value={exportOptions.bassInstrument}
                onChange={(e) => handleOptionChange('bassInstrument', parseInt(e.target.value))}
              >
                <option value="32">Acoustic Bass</option>
                <option value="33">Electric Bass</option>
                <option value="34">Electric Bass (pick)</option>
                <option value="35">Fretless Bass</option>
                <option value="36">Slap Bass 1</option>
                <option value="42">Cello</option>
              </select>
            </label>
          </div>

          <div className="option-group">
            <label>
              <input
                type="checkbox"
                checked={exportOptions.applyExpression}
                onChange={(e) => handleOptionChange('applyExpression', e.target.checked)}
              />
              Apply Expression (dynamics, volume changes)
            </label>
          </div>

          <div className="option-group">
            <label>
              <input
                type="checkbox"
                checked={exportOptions.humanize}
                onChange={(e) => handleOptionChange('humanize', e.target.checked)}
              />
              Humanize (slight timing and velocity variations)
            </label>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={!data}
        >
          Export as MIDI
        </button>
      </div>

      {exportStatus && (
        <div className={`export-status ${exportStatus.includes('Error') ? 'error' : 'success'}`}>
          {exportStatus}
        </div>
      )}

      <div className="export-info">
        <p>
          Export your {type === 'melody' ? 'melody' : 'chord progression'} as a standard MIDI file
          that can be imported into any Digital Audio Workstation (DAW) like Ableton Live,
          Logic Pro, FL Studio, etc.
        </p>
        <p>
          <strong>Pro Tip:</strong> Customize your export with the options above to create more
          professional and complete MIDI files with multiple tracks and instruments.
        </p>
      </div>
    </div>
  );
}

export default MIDIExport;
