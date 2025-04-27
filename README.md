# MIDI Melody & Chord Generator

A web application for generating melodies and chord progressions, visualizing them, and exporting them as MIDI files.

## Features

- **Melody Generator**: Create melodies based on different scales, tempos, and complexity levels
- **Chord Generator**: Generate chord progressions in various keys with common progression patterns
- **Visualization**: View a visual representation of your melodies and chord progressions
- **MIDI Export**: Export your creations as standard MIDI files for use in any DAW

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/midi-web-app.git
   cd midi-web-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Melody Generator

1. Select a scale from the dropdown menu
2. Adjust the tempo using the slider
3. Set the number of bars for your melody
4. Adjust the complexity level
5. Click "Generate Melody" to create a new melody
6. Click "Play Melody" to hear your creation
7. View the visualization and export as MIDI if desired

### Chord Generator

1. Select a key from the dropdown menu
2. Choose a chord progression pattern
3. Adjust the tempo using the slider
4. Set the chord duration in bars
5. Configure advanced options:
   - Use voice leading for smoother chord transitions
   - Apply chord inversions
   - Use extended chords for richer harmonies
6. Choose sound options:
   - Toggle between synthesized sounds and realistic instrument sounds
   - Select from various instruments when using realistic sounds
7. Click "Generate Progression" to create a new chord progression
8. Click "Play Progression" to hear your creation
9. View the visualization and export as MIDI if desired

### MIDI Export

1. Enter a file name for your MIDI export
2. Configure export options:
   - Choose which tracks to include (melody, chords, bass)
   - Select instruments for each track
   - Apply expression and humanization for more natural-sounding MIDI
3. Click "Export as MIDI" to download your creation
4. Import the MIDI file into your favorite DAW for further editing

## Building for Production

To build the application for production:

```bash
npm run build
```

This will generate optimized assets in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Technologies Used

- React 19.0.0
- Vite
- Tone.js for audio synthesis
- JZZ.js for comprehensive MIDI support
- Tonal.js for enhanced music theory capabilities
- SoundFont-Player for realistic instrument sounds
- HTML5 Canvas for visualization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Music theory resources and chord progression patterns from various music education websites
- Inspiration from digital audio workstations and MIDI sequencers
