# MIDI Melody & Chord Generator

A web application for generating melodies and chord progressions, visualizing them, and exporting them as MIDI files.

![MIDI Tool Screenshot](screenshots/app-screenshot.png)

## 🎵 [Try the Live Demo](https://midi-generator-81875.web.app/)

## Why I Built This

As a musician and developer, I've always been fascinated by the intersection of music and technology. I created this tool to bridge the gap between music theory and digital music production, making it easier for musicians of all skill levels to experiment with melodies and chord progressions. The app serves as both a creative tool for experienced musicians and a learning resource for those new to music theory.

## Features

- **🎹 Melody Generator**: Create melodies based on different scales, tempos, and complexity levels
  - Choose from various scales and modes
  - Adjust complexity, rhythm patterns, and contours
  - Apply motifs, articulation, and humanization
  - Instantly hear your creations with built-in playback

- **🎵 Chord Generator**: Generate chord progressions in various keys with common progression patterns
  - Select from popular progression patterns (Pop, Jazz, Blues, etc.)
  - Apply voice leading for smoother transitions
  - Use inversions and extended chords for richer harmonies
  - Visualize chord voicings and relationships

- **👁️ Visualization**: View a visual representation of your melodies and chord progressions
  - Piano roll display for melodies
  - Chord diagrams with note highlighting
  - Interactive playback visualization

- **💾 MIDI Export**: Export your creations as standard MIDI files for use in any DAW
  - Configure track and instrument settings
  - Apply expression and humanization
  - Download ready-to-use MIDI files

- **☁️ User Accounts**: Save and organize your compositions
  - Create a personal library of melodies and progressions
  - Favorite your best creations for quick access
  - Export and backup your collection

## Quick Start

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/midi-tool.git
   cd midi-tool
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

### Development Commands

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

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

## Tech Stack

### Frontend
- **React** (v18.2.0) - Component-based UI library
- **Vite** (v5.0.10) - Fast build tool and development server
- **Chakra UI** (v2.8.2) - Component library with built-in dark mode
- **React Router** (v7.5.3) - Client-side routing

### Music & Audio
- **Tone.js** (v15.0.4) - Web Audio framework for synthesis and scheduling
- **Tonal.js** (v5.1.0) - Music theory library for scales, chords, and progressions
- **JZZ.js** (v1.9.3) - MIDI file creation and manipulation
- **SoundFont-Player** (v0.12.0) - Realistic instrument playback

### Backend & Storage
- **Firebase** (v11.6.1) - Authentication, database, and storage
- **React Firebase Hooks** (v5.1.1) - React bindings for Firebase

### Testing & Quality
- **Vitest** (v1.0.4) - Fast unit testing framework
- **React Testing Library** (v14.1.2) - Component testing utilities
- **ESLint** (v8.56.0) - Code linting
- **Prettier** (v3.2.5) - Code formatting

### Build & Deployment
- **GitHub** - Version control and CI/CD
- **Firebase Hosting** - Hosting and deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Music theory resources and chord progression patterns from various music education websites
- Inspiration from digital audio workstations and MIDI sequencers
