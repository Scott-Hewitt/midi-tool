import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders application header', () => {
    render(<App />);
    expect(screen.getByText('MIDI Melody & Chord Generator')).toBeInTheDocument();
    expect(screen.getByText('Generate melodies and chord progressions, visualize them, and export as MIDI files.')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /melody generator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chord generator/i })).toBeInTheDocument();
  });

  it('switches between tabs when clicked', () => {
    render(<App />);

    // Initially, Melody Generator tab should be active
    const melodyTab = screen.getByRole('button', { name: /melody generator/i });
    const chordTab = screen.getByRole('button', { name: /chord generator/i });

    expect(melodyTab).toHaveClass('active');
    expect(chordTab).not.toHaveClass('active');
    expect(screen.getByText('Scale:')).toBeInTheDocument(); // Melody Generator content

    // Click on Chord Generator tab
    fireEvent.click(chordTab);

    // Now Chord Generator tab should be active
    expect(melodyTab).not.toHaveClass('active');
    expect(chordTab).toHaveClass('active');
    expect(screen.getByText('Key:')).toBeInTheDocument(); // Chord Generator content
  });

  it('renders footer information', () => {
    render(<App />);
    expect(screen.getByText('MIDI Melody & Chord Generator - MVP Version')).toBeInTheDocument();
  });
});
