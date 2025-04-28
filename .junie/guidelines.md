# MIDI Melody & Chord Generator - Development Guidelines

This document provides essential information for developers working on the MIDI Melody & Chord Generator project.

## Build/Configuration Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
To start the development server:
```bash
npm run dev
```
This will start a Vite development server at http://localhost:5173 with hot module replacement (HMR) enabled.

### Building for Production
To build the application for production:
```bash
npm run build
```
This will generate optimized assets in the `dist` directory.

### Preview Production Build
To preview the production build locally:
```bash
npm run preview
```

### Linting
To run ESLint:
```bash
npm run lint
```

## Testing Information

### Testing Framework
This project uses Vitest as the testing framework, along with React Testing Library for component testing.

### Running Tests
To run all tests once:
```bash
npm test
```

To run tests in watch mode (for development):
```bash
npm run test:watch
```

### Test Structure
- Tests are located in the `src/test` directory
- Test files should be named with the `.test.jsx` extension
- The test setup file is located at `src/test/setup.js`

### Writing Tests
Tests are written using Vitest and React Testing Library. Here's an example of a component test:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '../path/to/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<YourComponent />);
    const button = screen.getByRole('button', { name: /click me/i });

    fireEvent.click(button);

    expect(screen.getByText('Result after click')).toBeInTheDocument();
  });
});
```

### Adding New Tests
1. Create a new test file in the `src/test` directory with the `.test.jsx` extension
2. Import the necessary testing utilities from Vitest and React Testing Library
3. Import the component or function you want to test
4. Write your test cases using the `describe`, `it`, and `expect` functions
5. Run the tests to verify they pass

## Additional Development Information

### Project Structure
```
midi-web-app/
├── public/            # Static assets
├── src/
│   ├── assets/        # Project assets (images, etc.)
│   ├── test/          # Test files
│   ├── App.jsx        # Main application component
│   ├── App.css        # Application styles
│   ├── main.jsx       # Application entry point
│   └── index.css      # Global styles
├── .junie/            # Project documentation
├── index.html         # HTML template
├── vite.config.js     # Vite configuration
├── eslint.config.js   # ESLint configuration
└── package.json       # Project dependencies and scripts
```

### Code Style
- This project uses ESLint for code linting
- React components should be written using functional components and hooks
- Use named exports for components and utilities
- Follow the React hooks rules (don't call hooks conditionally)

### Frontend Stack
- React 19.0.0 for UI components
- Vite for build tooling and development server
- Web Audio API for audio preview functionality (planned)
- MIDI.js or Tone.js for MIDI handling in the browser (planned)
- HTML5 Canvas or SVG for music visualization (planned)

### Data Models
The application uses the following data models:

#### Melody Model
```javascript
{
  scale: String,        // E.g., "C major", "A minor"
  tempo: Number,        // BPM
  length: Number,       // Bars/measures
  complexity: Number,   // 1-10 scale
  notes: [              // Array of note objects
    {
      pitch: Number,    // MIDI note number
      duration: Number, // In beats or ticks
      velocity: Number, // 0-127
      startTime: Number // Position in sequence
    }
  ]
}
```

#### Chord Progression Model
```javascript
{
  key: String,          // E.g., "C", "A minor"
  progression: [        // Array of chord objects
    {
      root: String,     // E.g., "C", "F#"
      type: String,     // E.g., "maj", "min7"
      duration: Number, // In bars/beats
      position: Number  // Bar position
    }
  ]
}
```

### Performance Considerations
- Optimize audio processing to minimize latency
- Use memoization for complex calculations
- Consider using Web Workers for CPU-intensive tasks
- Implement efficient rendering for music visualization

### Browser Compatibility
The application should work on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Development Milestones

### Phase 1 - MVP
- Basic melody generation with scale selection
- Simple chord generation
- Basic visualization
- MIDI export capability

### Phase 2 - Enhanced Functionality
- Advanced melody controls
- Extended chord options
- Improved visualization
- Save/load functionality

### Phase 3 - Advanced Features
- User accounts
- Sharing capabilities
- Advanced algorithmic composition features
- DAW integration research

## Implementation Considerations

### Music Theory Implementation
- Implementation of scale patterns and modes
- Chord progression rules and harmony principles
- Rhythmic pattern generation algorithms
- Musical form structures (AABA, verse-chorus, etc.)

### User Experience Design
- Intuitive parameter controls with visual feedback
- Real-time preview capabilities
- Accessible design for musicians of varying expertise levels
- Visual representations aligned with standard music notation practices

### Technical Challenges
- Generating musically coherent melodies that sound pleasing
- Ensuring proper MIDI timing and synchronization
- Efficient handling of audio preview and playback
- Cross-browser compatibility for Web Audio API implementation

## Testing Strategy

### Functional Testing
- Verification of melody generation against specified parameters
- Validation of chord progression generation rules
- MIDI export format compliance testing
- UI control responsiveness and interaction testing

### User Acceptance Testing
- Musician feedback on generated content quality
- Usability testing with different user proficiency levels
- DAW compatibility testing with popular platforms (Ableton, Logic, FL Studio, etc.)
- Performance testing on various devices and browsers

## Future Expansion Considerations
- DAW plugin development (VST/AU format)
- Integration with popular DAWs via API
- Advanced generation algorithms (possibly AI-based)
- Community features for sharing creations
- Integration with cloud storage services
- Mobile app version
